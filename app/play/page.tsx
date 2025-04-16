'use client'
import "@/globals.css"
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from "react"
import ReactPlayer from 'react-player/youtube'
import { saveShuffledSequence, saveLastPlayedIndex, saveChains } from '@/store/storage'
import MediaButton from '@/components/MediaButton'
import { useUserStore, useVideoStore } from "@/store/useStore"
import PlaylistPreviewModal from "@/components/PlaylistPreviewModal"

export default function PlayerPage() {
  const {userId, playlists, loadPlaylists} = useUserStore()
  const {videos,loadVideos} = useVideoStore()
  const searchParams = useSearchParams()
  const listIDParam = searchParams.get('list') ?? ""
  let [shuffledIndexes, setShuffledIndexes] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReady, setReady] = useState<boolean>(false)
  const playerRef = useRef<ReactPlayer | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  let data = playlists[listIDParam]
  const [chainMap] = useState<Map<number,[number, boolean]>>(new Map) // videoIndex: [chainIndex, isIncluded]
  const [isChainIncluded] = useState<Set<number>>(new Set) // chainIndex

  // 처음 접속하면 실행
  useEffect(() => {
    if (!listIDParam) return

    loadPlaylists()
    setReady(true)
  }, [listIDParam])

  useEffect(() => {
    if(!isReady) return
    data = playlists[listIDParam]
    if(!data) return
    if(videos.length <= 0)
      LoadPlaylist(true)
    else
      LoadPlaylist(false)
  }, [isReady])

   // 비디오 불러온게 없으면 불러오고 섞인 순서와 마지막 재생 인덱스 가져오기
   const LoadPlaylist = async (doGetVideos : boolean) => {
    if(doGetVideos) await loadVideos(listIDParam)
    const list = data.shuffledSequence
    setShuffledIndexes(list.length === 0 ? shuffleVideos(true) : list)
    setCurrentIndex(data.lastPlayed)
  }

  const shuffleVideos = (isTargetAll:boolean) => {
    //이미 재생된 영상 중에서 체인이 온전하게 재생된 것을 추출
    chainMap.clear()
    const alreadyPlayed = shuffledIndexes.slice(0,currentIndex)
    for(let i=0;i<data.chains.length;i++){
      let index = alreadyPlayed.indexOf(data.chains[i][0])
      if(index===-1) continue
      let isIntact = true
      for(let j=1;j<data.chains[i].length;j++){
        if(alreadyPlayed[++index] === undefined) break
        if(alreadyPlayed[index] === data.chains[i][j]) continue
        isIntact = false
        break
      }
      if(!isIntact) continue
      isChainIncluded.add(i)
      data.chains[i].forEach(e => chainMap.set(e,[i,false]) )
    }
    // 1-1. 재생안된 체인을 추출 후, 셔플함.
    const chainShuffled = shuffle<number[]>([...data.chains.filter((_,i) => !isChainIncluded.has(i))])
    saveChains(userId, listIDParam, [...data.chains, ...chainShuffled])
    loadPlaylists()
    //1-3. 셔플 대상인 영상의 배열 추출.
    //     이 과정에서 제외된 적이 있는 영상은 chainRank에 [rank, true] 로 마킹.
    let targetVideos : number[] = extractTargetVideos(isTargetAll)
    targetVideos = targetVideos.filter(e => {
      let value = chainMap.get(e)
      if(value){
        chainMap.set(e, [value[0], true])
        return false
      }
      return true
    })
    // 1-4. value에 여전히 false값을 가지고 있는 영상은 체인에서 일시적으로 제외됨.
    chainMap.forEach((value, key) => {
      if(value){
        let removeIndex = chainShuffled[value[0]].indexOf(key)
        chainShuffled[value[0]].splice(removeIndex,1)
      }
    })
    // 1-5. 추출한 영상 배열을 셔플함.
    const videoShuffled: (number|number[])[] = shuffle<number>(targetVideos)
    // 1-6. videoShuffle.length+1개의 숫자에서 chainShuffled.length 만큼 인덱스를 랜덤으로 뽑음.
    let insertIndex = []
    for(let i=0;i<chainShuffled.length; i++)
      insertIndex.push( Math.floor( Math.random() * (videoShuffled.length+1) ) )
    // 1-7. 가장 작은 인덱스부터 랭크가 작은 체인을 해당 인덱스에 삽입함. 이 때, 인덱스는 연관된 체인의 랭크를 더함.
    insertIndex.sort()
    for(let i=0;i<chainShuffled.length; i++)
      videoShuffled.splice(insertIndex[i]+i, 0 , chainShuffled[i])
    // 1-8. 최종적으로 셔플된 배열을 1차원 배열로 변경 후 저장
    let shuffled : number[] = [...shuffledIndexes]
    shuffled = shuffled.concat(...videoShuffled)
    saveShuffledSequence(userId, listIDParam, shuffled)
    return shuffled
  }

  function extractTargetVideos(isTargetAll: boolean) {
    let arr = []
    if(isTargetAll){
      shuffledIndexes = []
      arr = [...Array(videos.length).keys()]
      return arr
    }
    let havePlayed = chainMap.get(shuffledIndexes[currentIndex])
    if (!havePlayed)
      arr = [...shuffledIndexes.splice(currentIndex + 1)]
    else {
      let chain = data.chains[havePlayed[0]]
      const index = chain.indexOf(shuffledIndexes[currentIndex])
      for(let i=index; i<chain.length;i++){
        const newIndex = currentIndex+i-index
        if(shuffledIndexes[newIndex] === chain[i]) continue
        let found = shuffledIndexes.indexOf(chain[i],newIndex)
        if(found === -1){
          //못찾으면
          continue
        }
        ;[shuffledIndexes[newIndex], shuffledIndexes[found]] = [shuffledIndexes[found], shuffledIndexes[newIndex]]
      }
      arr = [...shuffledIndexes.slice(currentIndex+chain.length-index)]
    }
    return arr
  }

  function shuffle<T>(arr: T[]) : T[] {
    const size = arr.length
    for (let i=size-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  // 영상 끝나면 다음 영상으로
  const handleEnded = () => {
    const next = (currentIndex + 1) % shuffledIndexes.length
    setCurrentIndex(next)
  }

  // 영상 재시작
  const restartCurrentVideo = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0, 'seconds')
    }
  }

  // 인덱스 바뀔 때,
  useEffect(() => {

    // 재생 중 인덱스 출력
    setTimeout(()=>saveLastPlayedIndex(userId, listIDParam, currentIndex),0)

    // 동적 타이틀
    if (shuffledIndexes.length > 0) {
      document.title = `${videos[shuffledIndexes[currentIndex]].title} - Playlist Shuffle`
    } else {
      document.title = 'Playlist Shuffle'
    }

    // 리스트 스크롤 맞추기
    const list = listRef.current
    if (!list) return
    const activeItem = list.children[currentIndex] as HTMLElement
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    if(!data) return
    
    // let rank = chainRank.get(shuffledIndexes[currentIndex])
    // if(rank)
    //   setCurrentRank((rank[0]+1)*10)
    // else {
    //   const temp = shuffledIndexes.slice(0,currentIndex)
    //   let lastChainRank = 0;
    //   for(let i=0;i<data.chains.length;i++){
    //     if(temp.includes(data.chains[i][0]))
    //       lastChainRank++;
    //     else break;
    //   }
    //   setCurrentRank(lastChainRank*10+5)
    // }
  }, [shuffledIndexes, currentIndex])

  return (
    <>
      {shuffledIndexes.length > 0 ? (  
        <>
          <section className="player flex flex-col items-center justify-center">
            {/* 유튜브 영상 재생 */}
            <div className="aspect-video mb-1.5 ytplayer">
              <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videos[shuffledIndexes[currentIndex]].videoId}`}
                playing={isPlaying}
                controls
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onReady={() => setIsPlaying(true)}
                width="100%"
                height="100%"
              />
            </div>
            {/* 미디어 버튼 그룹 */}
            <footer className="flex gap-2 ml-10">
              <MediaButton
                onClick={() => {
                  if (currentIndex === 0) {
                    restartCurrentVideo()
                  } else {
                    setCurrentIndex(currentIndex - 1)
                  }
                }}
                className = "flex items-center p-2 group-hover:bg-gray-500 transition-colors rounded-full ml-[-50%] mr-[50%]"
                innerText = "skip_previous"
                tooltipContent="이전 영상"
              />
              <MediaButton
                onClick={() => restartCurrentVideo()}
                className = "flex items-center p-2 group-hover:bg-gray-500 transition-colors rounded-full ml-[-50%] mr-[50%]"
                innerText = "resume"
                tooltipContent="영상 재시작"
              />
              <MediaButton
                onClick={() => setIsPlaying(prev => !prev)}
                className = "flex items-center p-2 group-hover:bg-green-500 transition-colors rounded-full ml-[-50%] mr-[50%]"
                innerText = {isPlaying ? "pause" : "play_arrow"}
                tooltipContent={isPlaying ? "일시정지" : "재생"}
              />
              <MediaButton
                onClick={() => setCurrentIndex(currentIndex<shuffledIndexes.length-1? currentIndex+1 : shuffledIndexes.length-1)}
                className = "flex items-center p-2 group-hover:bg-gray-500 transition-colors rounded-full ml-[-50%] mr-[50%]"
                innerText = "skip_next"
                tooltipContent="다음 영상"
              />
              <MediaButton
                onClick={() => {
                  const reShuffled = shuffleVideos(true)
                  setShuffledIndexes(reShuffled)
                  setCurrentIndex(0)
                }}
                className = "flex items-center p-2 group-hover:bg-gray-500 transition-colors rounded-full ml-[-50%] mr-[50%]"
                innerText="shuffle"
                tooltipContent="재셔플"
              />
              <MediaButton
                onClick={() => {
                  const reShuffled = shuffleVideos(false)
                  setShuffledIndexes(reShuffled)
                }}
                className = "flex items-center p-2 group-hover:bg-gray-500 transition-colors rounded-full ml-[-50%] mr-[50%]"
                innerText="arrow_split"
                tooltipContent="다음 영상부터 셔플"
              />
            </footer>
          </section>
          <section className="list flex flex-col grow items-center justify-center min-h-1/2">
            {/* 재생목록 */}
            <ul
              ref={listRef}
              className="w-11/12 h-px grow overflow-auto overflow-x-hidden border rounded-lg p-2 bg-white shadow"
            >
              {shuffledIndexes.map((video, index) => {
                return (
                  <li
                    key={index}
                    className={`border-b p-2 last:border-none cursor-pointer ${
                      index === currentIndex ? "bg-blue-200 active font-bold" : "hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      if (index === currentIndex) {
                        // 같은 영상 다시 클릭 → 처음부터 재생
                        restartCurrentVideo()
                      } else {
                        setCurrentIndex(index) // 다른 영상이면 전환
                      }
                    }}
                  >
                    <div>{videos[video].title}</div>
                    <div className="text-xs text-gray-500">{videos[video].channelTitle}</div>
                  </li>
                );
              })}
            </ul>
            <footer className="flex justify-between w-11/12 pl-3">
              <MediaButton
                className="flex cursor-pointer text-gray-500 group-hover:text-gray-700 ml-[-50%]"
                onClick={() => {
                  if(Object.keys(playlists).length === 0)
                    loadPlaylists()
                  setIsModalOpen(true)
                }}
                innerText="settings"
                tooltipContent="재생목록 설정"
              />
              <p className = "font-bold text-base">{currentIndex+1}/{shuffledIndexes.length}</p>
            </footer>
          </section>
        </>
      ) :
        <p>잠시만 기다려 주세요.</p>
      }
      {isModalOpen && 
        <PlaylistPreviewModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStartShuffle={(chains) => {
            setIsModalOpen(false)
            saveChains(userId, listIDParam, chains)
            loadPlaylists()
          }}
          videos={videos}
          playlistData={data}
        />
      }
    </>
  );
}
