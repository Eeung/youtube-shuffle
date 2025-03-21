import axios from "axios";

const API_KEY = "AIzaSyD1ke6FFlpLgjTYgy5PAq8nPMhCtnRIivs"; // youtube api key
const BASE_URL = "https://www.googleapis.com/youtube/v3/playlistItems";

export async function getPlaylistVideos(playlistId) {
    let videos = [];
    let nextPageToken = "";
    
    try {
      do {
        const response = await axios.get(BASE_URL, {
          params: {
            part: "snippet",
            maxResults: 50, // 한 번에 최대 50개
            playlistId,
            key: API_KEY,
            pageToken: nextPageToken, // 다음 페이지 토큰 추가
          },
        });
  
        const items = response.data.items.map((item) => ({
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
        }));
  
        videos = [...videos, ...items];
        nextPageToken = response.data.nextPageToken || ""; // 다음 페이지가 없으면 종료
  
      } while (nextPageToken);
  
      return videos;
    } catch (error) {
      console.error("YouTube API Error:", error);
      return [];
    }
}