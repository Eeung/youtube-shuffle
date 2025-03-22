'use client'
import { useState, useEffect, useRef } from "react";
import ReactPlayer from 'react-player/youtube'
import { getPlaylistVideos } from "./utils/youtube";
import Head from 'next/head';
import { list } from "postcss";

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // swap
  }
  return shuffled;
}

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [videos, setVideos] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const playerRef = useRef(null); // 🔥 재생목록 자동 스크롤을 위한 Ref
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const handleShuffle = async () => {
    try {
      const url = new URL(playlistUrl);
      const playlistId = url.searchParams.get("list");

      if (!playlistId) {
        alert("유효한 유튜브 재생목록 URL을 입력하세요!");
        return;
      }

      const videos = await getPlaylistVideos(playlistId);
      const shuffledVideos = shuffleArray(videos);
      setVideos(shuffledVideos);
      setCurrentIndex(0);
    } catch (error) {
      alert("올바른 URL을 입력하세요!");
    }
  };

  const handleEnded = () => {
    const next = (currentIndex + 1) % videos.length
    setCurrentIndex(next)
  }

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  const restartCurrentVideo = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0, 'seconds');
    }
  };

  useEffect(() => {
    if (videos.length > 0) {
      document.title = `${videos[currentIndex].title} - Playlist Shuffle`;
    } else {
      document.title = 'YouTube Playlist Shuffle';
    }
  }, [videos, currentIndex]);

  useEffect(() => {
    inputRef.current?.focus();
    const checkHeight = () => {
      const player = document.getElementsByClassName("ytplayer")[0];
      if(!player) return;
      const height = player.parentElement.parentElement.offsetHeight;
      const playerDiv = document.getElementsByClassName("player")[0];
      const listDiv = document.getElementsByClassName("list")[0];
      if(height<530){
        player.classList.add("hidden");
        playerDiv.classList.remove("h-1/2");
        listDiv.classList.remove("h-1/2");
        listDiv.classList.add("h-11/12");
      } else {
        player.classList.remove("hidden");
        playerDiv.classList.add("h-1/2");
        listDiv.classList.add("h-1/2");
        listDiv.classList.remove("h-11/12");
      }
    };

    setTimeout(checkHeight, 0);
    window.addEventListener("resize", checkHeight); // 창 크기 바뀌면 재측정

    return () => {
      window.removeEventListener("resize", checkHeight);
    };
  }, []);

  return (
    <div className="w-screen h-screen">
      <div className="flex justify-between py-2.5 px-3.5 border-b-2">
        <h1 className="text-3xl font-bold hover:underline">YouTube Playlist Shuffle</h1>
        {/* URL 입력 */}
        <div className="url-input px-6">
          <input
            ref={inputRef}
            type="text"
            placeholder="유튜브 재생목록 URL 입력"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleShuffle();
                inputRef.current.blur();
              }
            }}
            className="border p-2 rounded-lg flex-1 w-full hover:shadow"
          />
        </div>
        {/* 입력 버튼 */}
        <button onClick={handleShuffle} 
          className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow"
        >
          셔플 시작
        </button>
      </div>
      <div className = "flex justify-center items-center playground w-screen">
        {videos.length > 0 &&
          <div className="bg-gray-300 w-5/6 h-11/12 p-4 rounded-2xl max-w-7xl">
            <div className="player flex flex-col items-center justify-center h-1/2">
              {/* 유튜브 영상 재생 */}
              <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videos[currentIndex].videoId}`}
                playing={isPlaying}
                controls
                onEnded={handleEnded}
                width="91.6%"
                height="83.2%"
                className='ytplayer'
              />
              {/* 미디어 버튼 그룹 */}
              <div className="flex gap-2 mt-1.5">
                <div
                  onClick={() => {
                    if (currentIndex === 0) {
                      restartCurrentVideo();
                    } else {
                      setCurrentIndex(currentIndex - 1);
                    }
                  }}
                  className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">arrow_circle_left</span>
                </div>
                <div
                  onClick={() => setIsPlaying(prev => !prev)}
                  className = "flex items-center p-2 hover:bg-green-500 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">{isPlaying ? "pause_circle" : "play_circle"}</span>
                </div>
                <div
                  onClick={() => setCurrentIndex(currentIndex<videos.length-1? currentIndex+1 : videos.length-1)}
                  className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">arrow_circle_right</span>
                </div>
              </div>
            </div>
            <div className="list flex flex-col items-center justify-center h-1/2">
              {/* 재생목록 */}
              <ul
                className="w-11/12 h-full overflow-auto border rounded-lg p-2 bg-white shadow"
              >
                {videos.map((video, index) => {
                  const itemRef = index === currentIndex ? listRef : null;

                  return (
                    <li
                      key={index}
                      ref={itemRef}
                      className={`border-b p-2 last:border-none cursor-pointer ${
                        index === currentIndex ? "bg-blue-200 active font-bold" : "hover:bg-gray-200"
                      }`}
                      onClick={() => {
                        if (index === currentIndex) {
                          // 같은 영상 다시 클릭 → 처음부터 재생
                          restartCurrentVideo();
                        } else {
                          setCurrentIndex(index); // 다른 영상이면 전환
                        }
                      }}
                    >
                      <div className="text-lg">{video.title}</div>
                      <div className="text-sm text-gray-500">{video.channelTitle}</div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-end w-11/12">
                <p className = "font-bold text-lg">{currentIndex+1}/{videos.length}</p>
              </div>
            </div>
          </div>
        }
      </div>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
    </div>
  );
}
