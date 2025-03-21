'use client'
import { useState, useEffect } from "react";
import { getPlaylistVideos } from "./utils/youtube";

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
    } catch (error) {
      alert("올바른 URL을 입력하세요!");
    }
  };

  useEffect(() => {
    if (!window.YT) {
      console.log("YouTube API 스크립트 로드 시작");
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onload = () => {
        console.log("YouTube API 로드 완료");
        setIsYouTubeReady(true);
      };
      document.body.appendChild(tag);
    } else {
      setIsYouTubeReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isYouTubeReady || videos.length === 0) return;

    console.log("새로운 YouTube 플레이어 생성");

    const newPlayer = new window.YT.Player("youtube-player", {
      height: "315",
      width: "560",
      playerVars: { autoplay: 1, mute: 0, controls: 1 },
      events: {
        onReady: (event) => {
          console.log("플레이어 준비 완료");
          setPlayer(event.target); // ✅ player 상태 업데이트
          event.target.loadPlaylist(videos.map(video => video.videoId)); // ✅ 임시 재생목록 추가
        },
        onStateChange: (event) => handleStateChange(event),
      },
    });

    return () => {
      newPlayer.destroy();
    };
  }, [isYouTubeReady, videos]);

  function handleStateChange(event) {
    let state = ""
    switch(event.data){
      case 0 :
        state = "Ended";
        break;
      case 1:
        state = "Playing";
        break;
      case 2:
        state = "Paused";
        break;
      case 3:
        state = "Buffering";
        break;
      case -1:
        state = "Unstarted";
    }
    console.log("현재 곡 제목: ", event.target.videoTitle, "\nonStateChange 호출됨: ", state);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="mt-8 text-3xl font-bold mb-4">YouTube Shuffle</h1>
      <input
        type="text"
        placeholder="유튜브 재생목록 URL 입력"
        value={playlistUrl}
        onChange={(e) => setPlaylistUrl(e.target.value)}
        className="border p-2 rounded w-96"
      />
      <button onClick={handleShuffle} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
        셔플 시작
      </button>

      {/* 유튜브 영상 재생 */}
      {videos.length > 0 && <div id="youtube-player" className="mt-4"></div>}

      {/* 영상 리스트 */}
      {videos.length > 0 && (
        <ul className="mt-4 w-4/5 h-1/2 overflow-auto border rounded-lg p-2 bg-white shadow">
          {videos.map((video, index) => (
            <li
              key={index}
              className="border-b p-2 last:border-none cursor-pointer hover:bg-gray-200"
              onClick={() => {
                if (player) {
                  player.playVideoAt(index); // ✅ 사용자가 선택한 영상으로 이동
                }
              }}
            >
              {video.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
