import { create } from 'zustand'
import { getPlaylistVideosOnce, VideoData } from './youtube'
import { getAllPlaylists, PlaylistData } from './storage'

type UserData = {
  userId: string
  setUserId: (id: string) => void
  playlists : Record<string, PlaylistData>
  loadPlaylists : () => void
}

type VideosData = {
  videos: VideoData[]
  loadVideos: (playlistId: string) => void
  resetVideos: () => void
}

export const useUserStore = create<UserData>((set) => ({
  userId: "master",
  setUserId: (id) => set({ userId: id }),
  playlists: {},
  loadPlaylists: () => set(state =>({
    playlists : getAllPlaylists(state.userId)
  }))
}))

export const useVideoStore = create<VideosData>((set) => ({
  videos: [],
  loadVideos: async (playlistId) => set({ videos: await getPlaylistVideosOnce(playlistId) }),
  resetVideos: () => set({ videos: [] })
}))