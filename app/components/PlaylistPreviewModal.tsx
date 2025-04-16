'use client'
import { useEffect, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { VideoData } from '@/store/youtube'
import { PlaylistData } from '@/store/storage'

interface PlaylistPreviewModalProps {
  open: boolean
  onClose: () => void
  onStartShuffle: (chains: number[][]) => void
  videos: VideoData[]
  playlistData : PlaylistData
}

export default function PlaylistPreviewModal({
  open,
  onClose,
  onStartShuffle,
  videos,
  playlistData
}: PlaylistPreviewModalProps) {
  const [selected, setSelected] = useState<number[]>([])
  const [selectedChains, setSelectedChains] = useState<number[]>([])
  const [chains, setChains] = useState<number[][]>([])
  const [viewChains, setViewChains] = useState(false)
  const draggingRef = useRef(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''

    if(playlistData.chains)
      setChains(playlistData.chains)

    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleItemClick = (index: number) => {
    if (viewChains) return
    setSelected((prev) =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const handleChainClick = (index: number) => {
    if (!viewChains) return
    setSelectedChains((prev) =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const addChain = () => {
    try{
      if ((selected.length>>>1) === 0) return
      setChains([...chains, [...selected]])
    } finally{
      setSelected([])
    }
  }

  const removeChains = (targetIndexes: number[]) => {
    setChains(chains.filter((_, i) => !targetIndexes.includes(i)))
    setSelectedChains([])
  }

  const handleDragStart = () => {
    draggingRef.current = true
  }

  const handleDragEnd = (result: any) => {
    draggingRef.current = false
    const { source, destination } = result

    const sourceChainIndex = parseInt(source.droppableId)
    const fromChain = [...chains[sourceChainIndex]]
    // 체인 밖으로 이동
    if (!destination) {
      fromChain.splice(source.index, 1)
      updateChains(fromChain, sourceChainIndex)
      return
    }
    const destinationChainIndex = parseInt(destination.droppableId)
    // 체인 간 이동
    if(sourceChainIndex !== destinationChainIndex){
      const toChain = [...chains[destinationChainIndex]]

      const [moved] = fromChain.splice(source.index, 1)
      toChain.splice(destination.index, 0, moved)
      updateChains(fromChain, sourceChainIndex, toChain, destinationChainIndex)
      return
    }
    // 같은 체인 안에서 이동
    const [moved] = fromChain.splice(source.index, 1)
    fromChain.splice(destination.index, 0, moved)
    updateChains(fromChain, sourceChainIndex)
  }

  const updateChains = (sourceChain:any, sourceIndex:number, destinationChain?:any, destinationIndex?:number) => {
    let updated = [...chains]
    if ((sourceChain.length>>>1) === 0) {
      updated.splice(sourceIndex, 1)

      const newSelectedChains = selectedChains
        .filter(i=> i !== sourceIndex)
        .map(e=> e>sourceIndex? e-1: e )
      
      setSelectedChains(newSelectedChains)
      
    } else {
      updated[sourceIndex] = sourceChain
    }

    if(destinationChain && destinationIndex !== undefined)
      updated[destinationIndex] = destinationChain
    setChains(updated)
    return
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
      <section className="bg-white rounded-xl p-6 w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg">
        <header className="flex items-center mb-2">
          <img src={playlistData.snippet.thumbnail} alt="Not Found" className="rounded-full size-12 mr-2" />
          <div>
            <h2 className="text-2xl font-bold mb-1">{playlistData.snippet.title}</h2>
            <p className="text-sm text-gray-500">{playlistData.snippet.description}</p>
          </div>
        </header>

        {/* 리스트 */}
        {!viewChains ? (
          <ul className="border rounded p-2 mb-3 max-h-[40vh] shadow overflow-y-auto">
            {videos.map((video, index) => {
              const isSelected = selected.includes(index)
              const isChained = chains.flat().includes(index)
              if (isChained) return null

              return (
                <li 
                  key={index} 
                  className={`flex justify-between items-center border-b last:border-none py-1 px-2 cursor-pointer rounded ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`} 
                  onClick={() => handleItemClick(index)}
                >
                  <div className="flex">
                    <div className="text-gray-800 text-2xl mr-2 w-fit">{index + 1}</div>
                    <div>
                      <div className=" font-semibold">{video.title}</div>
                      <div className="text-xs text-gray-500">{video.channelTitle}</div>
                    </div>
                  </div>
                  {isSelected && 
                    <span className="text-gray-500 float-right text-lg mr-2 w-fit">{selected.indexOf(index) + 1}</span>
                  }
                </li>
              )
            })}
          </ul>
        ) : (
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="border rounded p-2 mb-3 max-h-[40vh] shadow overflow-y-auto">
              {chains.map((chain, chainIndex) => (
                <Droppable droppableId={String(chainIndex)} key={chainIndex}>
                  {(provided) => (
                    <ul
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onClick = {() => {
                        if (draggingRef.current) return 
                        handleChainClick(chainIndex)
                      }}
                      className={`border rounded-md p-2 ${selectedChains.includes(chainIndex) ? "bg-yellow-100" : ""}`}
                    >
                      {chain.map((videoIndex, i) => (
                        <Draggable draggableId={`${chainIndex}-${videoIndex}`} index={i} key={videoIndex}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center border-b last:border-none py-1 px-2 cursor-move bg-white rounded shadow-sm"
                            >
                              <span className="text-gray-400 mr-2">☰</span>
                              <div className="flex">
                                <div className="text-gray-800 text-2xl mr-2 w-fit">{videoIndex + 1}</div>
                                <div>
                                  <div className="font-semibold">{videos[videoIndex].title}</div>
                                  <div className="text-xs text-gray-500">{videos[videoIndex].channelTitle}</div>
                                </div>
                              </div>
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* 버튼들 */}
        <footer className="flex justify-between items-center mt-3">
          <div className="^LEFT^ flex gap-2">
            {!viewChains ? (
              <button 
                onClick={addChain} 
                className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600" 
              >
                추가
              </button>
            ) : (
              <button 
                onClick={() => removeChains(selectedChains)} 
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                삭제
              </button>
            )}
            <button 
              onClick={() => setViewChains(!viewChains)} 
              className="text-sm border px-3 py-1 rounded hover:bg-gray-100"
            >
              {viewChains ? "영상 목록 보기" : "고정 순서 보기"}
            </button>
          </div>
          <div className="^RIGHT^ flex gap-2">
            {/* <button 
              onClick={() => {
                //onSetupChains(chains)
              }} 
              className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
            >
              일반 재생
            </button> */}
            <button 
              onClick={() => 
                onStartShuffle(chains)
              } 
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              확인
            </button>
            <button 
              onClick={onClose} 
              className="text-sm border border-gray-400 px-3 py-1 rounded hover:bg-gray-100"
            >
              취소
            </button>
          </div>
        </footer>
        {viewChains &&
          <p className="flex justify-center text-sm text-gray-500 mb-[-20px]">변경된 고정 순서를 적용하려면, 재셔플을 해야 합니다.</p>
        }
      </section>
    </div>
  )
}