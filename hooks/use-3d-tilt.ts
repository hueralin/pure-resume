import { useState, useRef, useCallback } from 'react'

interface Use3DTiltOptions {
  /** 最大旋转角度（度），默认 10 */
  maxRotation?: number
  /** 透视距离（px），默认 1000 */
  perspective?: number
}

interface Rotation {
  x: number
  y: number
}

export function use3DTilt(options: Use3DTiltOptions = {}) {
  const { maxRotation = 10, perspective = 1000 } = options
  const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!elementRef.current) return

      const rect = elementRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // 计算相对于中心的位置（-1 到 1）
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -maxRotation
      const rotateY = ((x - centerX) / centerX) * maxRotation

      setRotation({ x: rotateX, y: rotateY })
    },
    [maxRotation]
  )

  const handleMouseLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 })
  }, [])

  const style: React.CSSProperties = {
    transform: `perspective(${perspective}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
    transformStyle: 'preserve-3d',
  }

  return {
    ref: elementRef,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style,
  }
}

