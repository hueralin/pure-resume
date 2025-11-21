'use client'

import * as React from 'react'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { useTheme } from 'next-themes'
import { Button } from 'antd'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // 避免 hydration 不匹配
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="default"
        icon={<SunOutlined />}
        disabled
      />
    )
  }

  return (
    <Button
      type="default"
      icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    />
  )
}

