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
}
export let videos : VideoData[] = []
export let playlist : listData

export async function getPlaylistMeta(playlistId: string) {
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('플레이리스트 정보를 가져오지 못했습니다.')

  const data = await res.json()
  const item = data.items?.[0]
  if (!item) throw new Error('플레이리스트가 존재하지 않습니다.')

  playlist = {
    id: playlistId,
    title: item.snippet.title,
    description: item.snippet.description
  }
}

export async function getPlaylistVideos(playlistId: string) {
  const maxResults = 50
  let nextPageToken = ''

  while (videos.length < 500) {
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
}