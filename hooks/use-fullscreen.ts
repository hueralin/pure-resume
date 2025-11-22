import { useEffect } from 'react'
import { useFullscreenStore } from '@/lib/store-fullscreen'

export function useFullscreen() {
  const { isFullscreen, setIsFullscreen } = useFullscreenStore()

  useEffect(() => {
    // 初始化检查
    setIsFullscreen(!!document.fullscreenElement)

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [setIsFullscreen])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message} (${e.name})`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  return { isFullscreen, toggleFullscreen }
}
