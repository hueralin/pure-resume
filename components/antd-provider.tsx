'use client'

import { ConfigProvider, theme, App } from 'antd'
import { useTheme } from 'next-themes'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import { useState, useEffect } from 'react'

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme: nextTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 在客户端挂载前，使用默认主题（暗色，因为 defaultTheme="dark"）避免 hydration 不匹配
  // 挂载后再切换到实际主题
  const getIsDark = () => {
    if (!mounted) return true // 默认使用暗色主题，与 defaultTheme="dark" 保持一致
    return nextTheme === 'dark' || (nextTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  const isDark = getIsDark()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#ffffff' : '#000000', // 使用主题色：暗色主题用白色，亮色主题用黑色
          colorTextLightSolid: isDark ? '#000000' : '#ffffff', // 主按钮文字颜色：暗色主题用黑色，亮色主题用白色
          borderRadius: 4,
        },
        components: {
          Form: {
            itemMarginBottom: 8, // 减小 Form.Item 之间的间距
          },
        },
        cssVar: {
          prefix: 'ant',
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  )
}

