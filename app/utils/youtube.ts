const API_KEY = "AIzaSyD1ke6FFlpLgjTYgy5PAq8nPMhCtnRIivs"; // youtube api key

export interface VideoData {
  videoId: string
  title: string
  channelTitle: string
}

export async function getPlaylistVideos(playlistId: string): Promise<VideoData[]> {
  const apiKey = API_KEY
  const maxResults = 50
  const videos: VideoData[] = []
  let nextPageToken = ''

  while (videos.length < 500) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`
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
          channelTitle: snippet.videoOwnerChannelTitle || snippet.channelTitle || '채널 없음',
        } as VideoData
      })
      .filter(Boolean)

    videos.push(...newVideos)

    if (!data.nextPageToken) break
    nextPageToken = data.nextPageToken
  }

  return videos
}