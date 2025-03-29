'use client'
import "@/globals.css";
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from "react";
import ReactPlayer from 'react-player/youtube'
import { videos, getPlaylistVideosOnce } from "@/utils/youtube";
import { saveShuffledSequence, saveLastPlayedIndex, getPlaylistData, PlaylistData } from '@/utils/storage'
import MediaButton from '@/components/MediaButton';

export default function PlayerPage() {
  const searchParams = useSearchParams()
  const listIDParam = searchParams.get('list') ?? ""
  const [videoIndexes, setVideoIndexes] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const playerRef = useRef<ReactPlayer | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  // 처음 접속하면 실행
  useEffect(() => {
    if (!listIDParam) return

    const data = getPlaylistData("master", listIDParam)
    if(!data) return
    if(videos.length <= 0)
      LoadPlaylist(data, true)
    else
      LoadPlaylist(data, false)

  }, [listIDParam])

  // Shuffle 알고리즘
  const shuffleArray = (size: number): number[] => {
    const shuffled : number[] = [...Array(videos.length).keys()]

    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    saveShuffledSequence("master", listIDParam, shuffled)
    return shuffled
  }

  // 비디오 불러온게 없으면 불러오고 섞인 순서와 마지막 재생 인덱스 가져오기
  const LoadPlaylist = async (data : PlaylistData, doGetVideos : boolean) => {
    if(doGetVideos) await getPlaylistVideosOnce(listIDParam)
    const list = data.shuffledSequence
    setVideoIndexes(list.length === 0 ? shuffleArray( videos.length ) : list)
    setCurrentIndex(data.lastPlayed)
  }

  // 영상 끝나면 다음 영상으로
  const handleEnded = () => {
    const next = (currentIndex + 1) % videoIndexes.length
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
    setTimeout(()=>saveLastPlayedIndex("master", listIDParam, currentIndex),0)

    // 동적 타이틀
    if (videoIndexes.length > 0) {
      document.title = `${videos[videoIndexes[currentIndex]].title} - Playlist Shuffle`
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
  }, [videoIndexes, currentIndex])

  return (
    <>
      {videoIndexes.length > 0 ? (  
        <>
          <section className="player flex flex-col items-center justify-center">
            {/* 유튜브 영상 재생 */}
            <div className="aspect-video mb-1.5 ytplayer">
              <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videos[videoIndexes[currentIndex]].videoId}`}
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
            <footer className="flex gap-2">
              <MediaButton
                onClick={() => {
                  if (currentIndex === 0) {
                    restartCurrentVideo()
                  } else {
                    setCurrentIndex(currentIndex - 1)
                  }
                }}
                className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                innerText = "arrow_circle_left"
              />
              <MediaButton
                onClick={() => restartCurrentVideo()}
                className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                innerText = "not_started"
              />
              <MediaButton
                onClick={() => setIsPlaying(prev => !prev)}
                className = "flex items-center p-2 hover:bg-green-500 transition-colors rounded-full"
                innerText = {isPlaying ? "pause_circle" : "play_circle"}
              />
              <MediaButton
                onClick={() => setCurrentIndex(currentIndex<videoIndexes.length-1? currentIndex+1 : videoIndexes.length-1)}
                className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                innerText = "arrow_circle_right"
              />
              <MediaButton
                onClick={() => {
                  const reShuffled = shuffleArray( videoIndexes.length )
                  setVideoIndexes(reShuffled)
                  setCurrentIndex(0)
                }}
                className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                innerText="shuffle"
              />
            </footer>
          </section>
          <section className="list flex flex-col grow items-center justify-center min-h-1/2">
            {/* 재생목록 */}
            <ul
              ref={listRef}
              className="w-11/12 h-px grow overflow-auto overflow-x-hidden border rounded-lg p-2 bg-white shadow"
            >
              {videoIndexes.map((video, index) => {
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
                    <div className="text-sm">{videos[video].title}</div>
                    <div className="text-xs text-gray-500">{videos[video].channelTitle}</div>
                  </li>
                );
              })}
            </ul>
            <footer className="flex justify-end w-11/12">
              <p className = "font-bold text-base">{currentIndex+1}/{videoIndexes.length}</p>
            </footer>
          </section>
        </>
      ) :
        <p>잠시만 기다려 주세요.</p>
      }
    </>
  );
}
