import { create } from 'zustand'

interface FullscreenState {
  isFullscreen: boolean
  setIsFullscreen: (isFullscreen: boolean) => void
}

export const useFullscreenStore = create<FullscreenState>((set) => ({
  isFullscreen: false,
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
}))

