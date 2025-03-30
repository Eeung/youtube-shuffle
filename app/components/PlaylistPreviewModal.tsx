'use client'
import { useEffect, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface VideoData {
  title: string
  channelTitle: string
}

interface PlaylistPreviewModalProps {
  open: boolean
  onClose: () => void
  onStartShuffle: (chains: number[][]) => void
  videos: VideoData[]
  title: string
  description: string
  thumbnail: string
}

export default function PlaylistPreviewModal({
  open,
  onClose,
  onStartShuffle,
  videos,
  title,
  description,
  thumbnail
}: PlaylistPreviewModalProps) {
  const [selected, setSelected] = useState<number[]>([])
  const [selectedChains, setSelectedChains] = useState<number[]>([])
  const [chains, setChains] = useState<number[][]>([])
  const [viewChains, setViewChains] = useState(false)
  const draggingRef = useRef(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
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
    if (!destination) {
      handleDragToOut(source)
      return
    }

    const chainIndex = parseInt(source.droppableId)
    const newChain = [...chains[chainIndex]]
    const [moved] = newChain.splice(source.index, 1)
    newChain.splice(destination.index, 0, moved)
    const updated = [...chains]
    updated[chainIndex] = newChain
    setChains(updated)
  }

  const handleDragToOut = (source:any) => {
    const chainIndex = parseInt(source.droppableId)
    const newChain = [...chains[chainIndex]]
    newChain.splice(source.index, 1)

    let updated = [...chains]
    if ((newChain.length>>>1) === 0) {
      //삭제될 때, 기존 선택된 체인들 인덱스 변경해야함
      //1,2,5번이 선택될 때, 2번이 삭제되면, 1,4번으로 변경
      updated.splice(chainIndex, 1)


      const newSelectedChains = selectedChains
        .filter(i=> i !== chainIndex)
        .map(e=> e>chainIndex? e-1: e )
      
      setSelectedChains(newSelectedChains)
      
    } else {
      updated[chainIndex] = newChain
    }

    setChains(updated)
    return
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
      <section className="bg-white rounded-xl p-6 w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg">
        <header className="flex items-center mb-2">
          <img src={thumbnail} alt="Not Found" className="rounded-full size-12 mr-2" />
          <div>
            <h2 className="text-2xl font-bold mb-1">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
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
                  <div>
                    <span className="float-left text-gray-800 text-2xl mr-2 w-fit">{index + 1}</span>
                    <span className='float-left'>
                      <div className="text-sm font-semibold">{video.title}</div>
                      <div className="text-xs text-gray-500">{video.channelTitle}</div>
                    </span>
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
                              <div>
                                <span className="float-left text-gray-800 text-2xl mr-2 w-fit">{videoIndex + 1}</span>
                                <span className='float-left'>
                                  <div className="text-sm font-semibold">{videos[videoIndex].title}</div>
                                  <div className="text-xs text-gray-500">{videos[videoIndex].channelTitle}</div>
                                </span>
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
            <button 
              onClick={() => {
                //onSetupChains(chains)
              }} 
              className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
            >
              일반 재생
            </button>
            <button 
              onClick={() => 
                onStartShuffle(chains)
              } 
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              셔플 시작
            </button>
            <button 
              onClick={onClose} 
              className="text-sm border border-gray-400 px-3 py-1 rounded hover:bg-gray-100"
            >
              취소
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}