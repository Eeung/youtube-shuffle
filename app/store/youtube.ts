import { PlaylistInfo } from "./storage";

const API_KEY = "AIzaSyD1ke6FFlpLgjTYgy5PAq8nPMhCtnRIivs"; // youtube api key

export interface VideoData {
  videoId: string
  title: string
  channelTitle: string
}

const inFlightFetches: Record<string, Promise<VideoData[]> | undefined> = {};

export async function getPlaylistMeta(playlistId: string) : Promise<PlaylistInfo> {
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('플레이리스트 정보를 가져오지 못했습니다.')

  const data = await res.json()
  const item = data.items?.[0]
  if (!item) throw new Error('플레이리스트가 존재하지 않습니다.')

  return {
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.default.url
  }
}

export function getPlaylistVideosOnce(listId: string): Promise<VideoData[]> {
  if (inFlightFetches[listId]) {
    return inFlightFetches[listId]; // 이미 실행 중이면 그걸 그대로 반환
  }

  const promise = getPlaylistVideos(listId).finally(() => {
    delete inFlightFetches[listId]; // 끝나면 캐시 제거
  });

  inFlightFetches[listId] = promise;
  return promise;
}

async function getPlaylistVideos(playlistId: string) : Promise<VideoData[]>{
  const maxResults = 50
  let nextPageToken = ''
  const fetched : VideoData[] = []

  while (true) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${API_KEY}&pageToken=${nextPageToken}`
    const res = await fetch(url)
    const data = await res.json()

    if (!data.items) break

    const newVideos = data.items
      .map((item: any) => {
        const snippet = item.snippet
        if (!snippet || !snippet.resourceId || !snippet.resourceId.videoId) return null

        return {
          videoId: snippet.resourceId.videoId,
          title: snippet.title,
          channelTitle: snippet.videoOwnerChannelTitle || snippet.channelTitle || '채널 없음'
        } as VideoData
      })
      .filter(Boolean)
      
      fetched.push(...newVideos)

    if (!data.nextPageToken) break
    nextPageToken = data.nextPageToken
  }
  return fetched
}