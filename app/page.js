'use client'
import { useState, useEffect, useRef } from "react";
import { getPlaylistVideos } from "./utils/youtube";
import { markCurrentScopeAsDynamic } from "next/dist/server/app-render/dynamic-rendering";

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
  const [player, setPlayer] = useState(null);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playAndPause, setPlayAndPause] = useState("pause");
  const [worker, setWorker] = useState(null);
  const listRef = useRef(null); // 🔥 재생목록 자동 스크롤을 위한 Ref

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

  function loadVideo(index) {
    if (index >= videos.length) return;
    setCurrentIndex(index);

    const videoId = videos[index].videoId;
    const nextId = videos[index].videoId;
    const iframeContainer = document.getElementById("youtube-container");

    if(!iframeContainer.firstChild) {
      // 새로운 iframe 추가 (enablejsapi=1 → API 호출 가능)
      const newIframe = document.createElement("iframe");
      newIframe.width = "800";
      newIframe.height = "450";
      newIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`;
      newIframe.allow = "autoplay; encrypted-media";
      newIframe.id = "youtube-iframe";
      iframeContainer.appendChild(newIframe);

      // 새로운 플레이어 설정
      setTimeout(() => {
        setPlayer(newIframe.contentWindow);
      }, 1000);
    } else {
      iframeContainer.firstChild.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`;
    }
  }

  function checkVideoEnd() {
    if (!player) return;

    // YouTube iFrame에 메시지 보내서 현재 재생 상태 요청
    player.postMessage(
      JSON.stringify({ event: "listening", id: "player-state" }),
      "*"
    );
  }

  useEffect(() => {
    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.info && data.info.playerState === 0) {
          console.log("🎵 영상 종료 감지됨!");
          const nextIndex = (currentIndex + 1) % videos.length;
          loadVideo(nextIndex); // ✅ 다음 영상 재생
        }
      } catch (e) {}
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [player, currentIndex]);

  // 1초마다 영상 종료 여부 체크
  useEffect(() => {
    const interval = setInterval(checkVideoEnd, 1000);
    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (videos.length > 0) {
      loadVideo(0);
    }
  }, [videos]);

  return (
    <div className="w-screen h-screen">
      <div className="flex justify-between py-2.5 px-3.5 border-b-2">
        <h1 className="text-3xl font-bold">YouTube Playlist Shuffle</h1>
        {/* URL 입력 */}
        <div className="url-input px-6">
          <input
            type="text"
            placeholder="유튜브 재생목록 URL 입력"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            className="border p-2 rounded flex-1 w-full"
          />
        </div>
        {/* 입력 버튼 */}
        <button onClick={handleShuffle} className="bg-blue-500 text-white px-4 py-2 rounded">
          셔플 시작
        </button>
      </div>
      <div className = "flex justify-center items-center playground w-screen">
        <div className="bg-gray-300 w-5/6 h-11/12 p-4 rounded-2xl">
          <div className="flex flex-col items-center justify-center h-1/2">
            {/* 유튜브 영상 재생 */}
            {videos.length > 0 && <div id="youtube-container" className="w-11/12 rounded ytplayer"></div>}

            {/* 미디어 버튼 그룹 */}
            {videos.length > 0 && (
              <div className="flex gap-2 mt-4">
                <div
                  onClick={() => player && player.previousVideo()}
                  className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">arrow_circle_left</span>
                </div>
                <div
                  onClick={() => 
                    player && (player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo())
                  }
                  className = "flex items-center p-2 hover:bg-green-500 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">{playAndPause}</span>
                </div>
                <div
                  onClick={() => player && player.nextVideo()}
                  className = "flex items-center p-2 hover:bg-gray-500 transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined">arrow_circle_right</span>
                </div>
              </div>
            )}
          </div>
          {videos.length > 0 && (
            <div className="flex flex-col items-center justify-center h-1/2">
              {/* 재생목록 */}
              <ul
                ref={listRef}
                className="w-11/12 h-full overflow-auto border rounded-lg p-2 bg-white shadow"
              >
                {videos.map((video, index) => (
                  <li
                    key={index}
                    className={`border-b p-2 last:border-none cursor-pointer ${
                      index === currentIndex ? "bg-blue-200 active font-bold" : "hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      if (player) {
                        setCurrentIndex(index);
                        if(index/200 >= 1)
                          updatePlaylist(index);
                        else 
                          player.playVideoAt(index);
                      }
                    }}
                  >
                    <div className="text-lg">{video.title}</div>
                    <div className="text-sm text-gray-500">{video.channelTitle}</div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end w-11/12">
                <p className = "font-bold text-lg">{currentIndex}/{videos.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
    </div>
  );
}
