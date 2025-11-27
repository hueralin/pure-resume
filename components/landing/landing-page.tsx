'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { use3DTilt } from '@/hooks/use-3d-tilt'

export function LandingPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { ref, onMouseMove, onMouseLeave, style } = use3DTilt()

  const handleClick = () => {
    if (token) {
      router.push('/resume')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* 画布区域，按照设计图 1280 × 720 */}
      <div className="relative w-[1280px] h-[720px] max-w-full">
        {/* 左侧深色内容卡片：1000 × 500，位置与设计保持一致 */}
        <div className="absolute top-[110px] left-[140px] w-[950px] h-[500px] bg-zinc-900 rounded-[4px] shadow-lg p-16">
          <h1 className="text-[48px] leading-none font-normal text-white mb-4 font-smooth-large">
            Pure Resume
          </h1>
          <p className="text-base text-white/80 mb-8 font-smooth-large">一个简单的简历</p>
          <button
            type="button"
            onClick={handleClick}
            className="self-start h-8 rounded-[4px] bg-white px-6 text-sm font-medium text-black hover:bg-white/90 transition-colors"
          >
            开始
          </button>
        </div>

        {/* 右侧白色预览区域：480 × 640 */}
        <div
          ref={ref}
          className="absolute top-[40px] left-[661px] w-[480px] h-[640px] rounded-[4px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={style}
        />
      </div>
    </div>
  )
}

