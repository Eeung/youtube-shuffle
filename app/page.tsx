'use client'

import { useEffect, useRef, useState } from 'react'
import { getPlaylistVideosOnce, getPlaylistMeta, videos, playlist, resetVideos } from '@/utils/youtube'
import { useRouter } from 'next/navigation'
import { savePlaylistMeta, getPlaylistData, getAllPlaylists, deletePlaylistData } from './utils/storage'
import PlaylistPreviewModal from './components/PlaylistPreviewModal'
import { json } from 'stream/consumers'

type StoredPlaylist = {
  title: string
  description: string
  thumbnail: string
}

export default function EditPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState<boolean>(false)
  const [playlistId, setPlaylistId] = useState<string>("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [storedPlaylists, setStoredPlaylists] = useState<Record<string, StoredPlaylist>>({})
  const [playlistInfo, setPlaylistInfo] = useState({
    title: "",
    description: "",
    thumbnail:""
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter()

  // 재생목록의 정보를 가져오기
  const handleLoadPlaylist = async () => {
    try {
      const listId = new URL(url).searchParams.get('list')
      if (!listId) 
        return

      setPlaylistId(listId)
      setLoading(true)

      let data = getPlaylistData("master", listId)
      if(!data){
        setPlaylistInfo(await getPlaylistMeta(listId))
        savePlaylistMeta("master", listId, playlist.title, playlist.description, playlist.thumbnail)
      } else {
        setPlaylistInfo({
          title : data.title,
          description : data.description,
          thumbnail : data.thumbnail
        })
      }

      await getPlaylistVideosOnce(listId)

      setIsModalOpen(true);
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  // 영상 플레이어로 이동
  const handleStartPlay = async (listId?: string) => {
    router.push(`/play?list=${listId ?? playlistId}`)
  }
  
  useEffect(() => {
    // 처음 접속 때, 링크 입력칸 포커스
    inputRef.current?.focus()
    resetVideos()

    // 불러왔던 재생목록 저장
    const data = getAllPlaylists('master')
    setStoredPlaylists(data)

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

  return (
    <div className="flex flex-col w-screen h-screen">
      <nav className="flex justify-between py-2.5 px-3.5 border-b-2">
        <h1 className="text-xl sm:text-3xl font-bold hover:underline">
          <span className="hidden sm:inline">YouTube </span>Playlist Shuffle
        </h1>
      </nav>
      <section className = "flex grow justify-center items-center w-screen h-px">
        <article className="flex flex-col bg-gray-300 w-5/6 h-11/12 px-4 rounded-2xl max-w-7xl">
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
            <button onClick={handleLoadPlaylist} 
            className="min-w-fit bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow">
              불러오기
            </button>
          </header>
          {loading && <p>불러오는 중...</p>}
          <section className='grow'>
            <section className='flex flex-col max-h-1/2 mb-2 border-b-2 pb-2'>
              <details open className="h-fit">
                <summary className="flex flex-row-reverse items-center max-w-fit mb-2 cursor-pointer">
                  <h2 className="inline-block text-2xl font-bold">📂 저장된 재생목록</h2>
                </summary>
                {Object.keys(storedPlaylists).length === 0 ? (
                  <p className="text-gray-500">저장된 재생목록이 없습니다.</p>
                ) : (
                  <ul className="space-y-2 overflow-auto">
                    {Object.entries(storedPlaylists).map(([playlistId, info]) => (
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
                          <p className="font-semibold">{info.title}</p>
                          <p className="text-sm text-gray-500">{info.description}</p>
                        </div>
                          
                        <div className='flex justify-center items-center'>
                          <button
                            className="material-symbols-outlined cursor-pointer text-red-400 hover:text-red-600 mr-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              const confirmed = confirm(`"${info.title}" 재생목록을 삭제할까요?`)
                              if (confirmed) {
                                deletePlaylistData('master', playlistId)
                                const newList = { ...storedPlaylists }
                                delete newList[playlistId]
                                setStoredPlaylists(newList)
                              }
                            }}
                          >
                            do_not_disturb_on
                          </button>
                          <button
                            className="material-symbols-outlined cursor-pointer text-gray-500 hover:text-gray-700"
                          >
                            settings
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </section>
          </section>
        </article>
      </section>

      {isModalOpen && 
        <PlaylistPreviewModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStartShuffle={() => {
            setIsModalOpen(false)
            handleStartPlay()
          }}
          onSetupCoupling={() => {
            alert("고정 규칙 설정은 추후 업데이트됩니다!")
          }}
          videos={videos}
          title={playlistInfo.title}
          description={playlistInfo.description}
          thumbnail={playlistInfo.thumbnail}
        />}
    </div>
  )
}
