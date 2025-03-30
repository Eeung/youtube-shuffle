import { create } from 'zustand'

type VideoData = {
  videoId: string
  title: string
  channelTitle: string
}

type PlaylistData = {
  title: string
  description: string
  lastPlayed: number
  shuffledSequence: number[]
  chains: number[][]
}

type PlaylistStore = {
  userId: string
  videos: Record<string, VideoData[]> // playlistId → videos
  playlists: Record<string, PlaylistData> // playlistId → data
  setUserId: (id: string) => void
  setVideos: (playlistId: string, data: VideoData[]) => void
  setPlaylist: (playlistId: string, data: PlaylistData) => void
}

export const usePlaylistStore = create<PlaylistStore>((set) => ({
  userId: 'master',
  videos: {},
  playlists: {},

  setUserId: (id) => set({ userId: id }),

  setVideos: (playlistId, data) =>
    set((state) => ({
      videos: { ...state.videos, [playlistId]: data },
    })),

  setPlaylist: (playlistId, data) =>
    set((state) => ({
      playlists: { ...state.playlists, [playlistId]: data },
    })),
}))