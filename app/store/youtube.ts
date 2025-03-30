const API_KEY = "AIzaSyD1ke6FFlpLgjTYgy5PAq8nPMhCtnRIivs"; // youtube api key

export interface VideoData {
  videoId: string
  title: string
  channelTitle: string
}

export interface listData {
  id : string
  title : string
  description : string
  thumbnail: string
}

export let videos : VideoData[] = []
export let playlist : listData = {
  id : "",
  title : "",
  description : "",
  thumbnail: "",
}

const inFlightFetches: Record<string, Promise<boolean> | undefined> = {};

export async function getPlaylistMeta(playlistId: string) : Promise<listData> {
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('플레이리스트 정보를 가져오지 못했습니다.')

  const data = await res.json()
  const item = data.items?.[0]
  if (!item) throw new Error('플레이리스트가 존재하지 않습니다.')

  return playlist = {
    id: playlistId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.default.url
  }
}

export function getPlaylistVideosOnce(listId: string): Promise<boolean> {
  if (inFlightFetches[listId]) {
    return inFlightFetches[listId]; // 이미 실행 중이면 그걸 그대로 반환
  }

  const promise = getPlaylistVideos(listId).finally(() => {
    delete inFlightFetches[listId]; // 끝나면 캐시 제거
  });

  inFlightFetches[listId] = promise;
  return promise;
}

async function getPlaylistVideos(playlistId: string) : Promise<boolean>{
  const maxResults = 50
  let nextPageToken = ''
  videos = []

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
      
      videos.push(...newVideos)

    if (!data.nextPageToken) break
    nextPageToken = data.nextPageToken
  }
  //videos = fetchedVideos
  return true
}

export function resetVideos() {
  videos = []
}