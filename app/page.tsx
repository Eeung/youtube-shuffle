'use client'
import "@/globals.css"
import { useEffect, useRef, useState } from 'react'
import { getPlaylistMeta } from '@/store/youtube'
import { useRouter } from 'next/navigation'
import { savePlaylistMeta, getPlaylistData, deletePlaylistData, saveChains } from '@/store/storage'
import PlaylistPreviewModal from '@/components/PlaylistPreviewModal'
import { useUserStore, useVideoStore } from "./store/useStore"
import Tekkai from "./components/Tekkai"
import MediaButton from "./components/MediaButton"

export default function EditPage() {
  const {userId, playlists, loadPlaylists} = useUserStore()
  const {videos,loadVideos,resetVideos} = useVideoStore()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState<boolean>(false)
  const [playlistId, setPlaylistId] = useState<string>("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 처음 접속 때, 링크 입력칸 포커스
    inputRef.current?.focus()
    resetVideos()

    // 불러왔던 재생목록 로드
    loadPlaylists()

    const summarys = document.querySelectorAll("summary")
    if(!summarys) return
    summarys.forEach((summary)=> {
      const detail = summary.parentElement
      if(!detail) return
      summary.addEventListener("click", (e) => {
        if (detail.hasAttribute("open")) { // since it's not closed yet, it's open!
          e.preventDefault() // stop the default behavior, meaning - the hiding
          detail.classList.add("closing") // add a class which applies the animation in CSS
          
        }
      })

      // when the "close" animation is over
      detail.addEventListener("animationend", (e) => {
        if (e.animationName === "close") {
          detail.removeAttribute("open")
          detail.classList.remove("closing") // remove the animation
        }
      })
    })
  },[])

  // 재생목록의 정보를 가져오기
  const handleLoadPlaylist = async (playlistId?: string) => {
    try {
      const listId = playlistId ?? new URL(url).searchParams.get('list')
      if (!listId) 
        return

      setPlaylistId(listId)
      setLoading(true)

      let data = getPlaylistData(userId, listId)
      if(!data){
        let info = await getPlaylistMeta(listId)
        savePlaylistMeta(userId, listId, info)
        loadPlaylists()
      }

      await loadVideos(listId)

      setIsModalOpen(true)
    } catch (err) {}
    finally {
      setLoading(false)
    }
  }

  // 영상 플레이어로 이동
  const handleStartPlay = async (listId?: string) => {
    router.push(`/play?list=${listId ?? playlistId}`)
  }

  return (
    <>
      <header className="flex justify-between w-full pb-4 border-b-2 mb-4">
        <div className="grow mr-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="유튜브 재생목록 URL 입력"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLoadPlaylist()
                e.currentTarget.blur()
              }
            }}
            className="bg-white border p-2 rounded-lg flex-1 w-full inline-block hover:shadow"
          />
        </div>
        <button onClick={() => handleLoadPlaylist()} 
        className="min-w-fit bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow">
          불러오기
        </button>
      </header>
      {loading && 
        <>
          <p>불러오는 중...</p>
          <Tekkai/>
        </>
      }
      <section className='grow'>
        <section className='flex flex-col max-h-1/2 mb-2 border-b-2 pb-2'>
          <details open className="h-fit">
            <summary className="flex flex-row-reverse items-center max-w-fit mb-2 cursor-pointer">
              <h2 className="inline-block text-2xl font-bold">📂 저장된 재생목록</h2>
            </summary>
            {Object.keys(playlists).length === 0 ? (
              <p className="text-gray-500">저장된 재생목록이 없습니다.</p>
            ) : (
              <ul className="space-y-2 overflow-auto">
                {Object.entries(playlists).map(([playlistId, info]) => (
                  <li
                    key={playlistId}
                    className="p-2 rounded flex justify-between transition"
                  >
                    <div
                      className='cursor-pointer'
                      onClick={() => {
                        handleStartPlay(playlistId)
                      }}
                    >
                      <p className="font-semibold">{info.snippet.title}</p>
                      <p className="text-sm text-gray-500">{info.snippet.description}</p>
                    </div>
                      
                    <div className='flex gap-2 justify-center items-center'>
                      <MediaButton
                        className="flex cursor-pointer text-red-400 group-hover:text-red-600 ml-[-50%] "
                        onClick={() => {
                          const confirmed = confirm(`"${info.snippet.title}" 재생목록을 삭제할까요?`)
                          if (!confirmed) return

                          deletePlaylistData('master', playlistId)
                          loadPlaylists()
                        }}
                        innerText="do_not_disturb_on"
                        tooltipContent="재생목록 삭재"
                      />
                      <MediaButton
                        className="flex cursor-pointer text-gray-500 group-hover:text-gray-700 ml-[-50%]"
                        onClick={() => {
                          handleLoadPlaylist(playlistId)
                        }}
                        innerText="settings"
                        tooltipContent="재생목록 설정"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </section>
      </section>

      {isModalOpen && 
        <PlaylistPreviewModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStartShuffle={(chains) => {
            setIsModalOpen(false)
            saveChains(userId, playlistId, chains)
            handleStartPlay()
          }}
          videos={videos}
          playlistData={playlists[playlistId]}
        />
      }
    </>
  )
}