'use client'

import { useEffect, useRef, useState } from 'react'
import { getPlaylistVideosOnce, getPlaylistMeta, videos, playlist, resetVideos } from '@/utils/youtube'
import { useRouter } from 'next/navigation'
import { savePlaylistMeta, getPlaylistData, getAllPlaylists, deletePlaylistData } from './utils/storage'

type StoredPlaylist = {
  title: string
  description: string
}

export default function EditPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState<boolean>(false)
  const [playlistId, setPlaylistId] = useState<string>("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [storedPlaylists, setStoredPlaylists] = useState<Record<string, StoredPlaylist>>({})
  const router = useRouter()

  // 재생목록의 정보를 가져오기
  const handleLoadPlaylist = async () => {
    try {
      const listId = new URL(url).searchParams.get('list')
      if (!listId) 
        return alert('유효한 재생목록 URL을 입력하세요.')

      setPlaylistId(listId)
      setLoading(true)

      const data = getPlaylistData("master", listId)
      if(!data){
        await getPlaylistMeta(listId)
        savePlaylistMeta("master", listId, playlist.title, playlist.description)
      }

      await getPlaylistVideosOnce(listId)
    } catch (err) {
      alert('올바른 URL이 아닙니다.')
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
  },[])

  return (
    <div className="h-screen w-screen">
      <nav className="flex justify-between py-2.5 px-3.5 border-b-2">
        <h1 className="text-3xl font-bold hover:underline">YouTube Playlist Shuffle</h1>
      </nav>
      <div className = "flex flex-col justify-center items-center playground w-screen">
        <div className="flex flex-col bg-gray-300 w-5/6 h-11/12 p-4 rounded-2xl max-w-7xl">
          <div className="flex justify-between w-full pb-4 border-b-2 mb-4">
            <div className="url-input">
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
            className="bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow">
              불러오기
            </button>
          </div>
          {loading && <p>불러오는 중...</p>}

          {videos.length > 0 && (
            <div className="pb-4 mb-2 border-b-2">
              <ul className="bg-white border p-4 rounded shadow max-h-[400px] overflow-auto mb-4">
                {videos.map((video, index) => (
                  <li key={index} className="flex pb-2 mb-2 border-b-[1px]">
                    <div className="inline-block text-4xl mr-2 ">{index+1}</div>
                    <div className="inline-block">
                      <div className="font-semibold">{video.title}</div>
                      <div className="text-sm text-gray-500">{video.channelTitle}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleStartPlay()}
                className="bg-green-400 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-green-500 hover:shadow text-lg font-bold"
              >
                ▶️ 셔플 시작
              </button>
            </div>
          )}
          <div className='grow'>
            <div className='flex flex-col max-h-1/2 mb-2 border-b-2 pb-2'>
              <h2 className="text-2xl font-bold mb-2">📂 저장된 재생목록</h2>
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
                        
                      <div className='flex flex-col justify-center'>
                        <button
                          className="material-symbols-outlined cursor-pointer text-red-400 hover:text-red-600"
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
