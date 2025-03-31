import { create } from 'zustand'
import { VideoData } from './youtube'

type UserData = {
  userId: string
  setUserId: (id: string) => void
}

type VideosData = {
  videos: VideoData[]
  setVideos: (v: VideoData[]) => void
  resetVideos: () => void
}

export const useUserStore = create<UserData>((set) => ({
  userId: "master",
  setUserId: (id) => set({ userId: id })
}))

export const useVideoStore = create<VideosData>((set) => ({
  videos: [],
  setVideos: (v) => set({ videos: v }),
  resetVideos: () => set({ videos: [] })
}))