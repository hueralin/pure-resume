import { App } from 'antd'

// Hook 版本，推荐使用
export function useToast() {
  const { message } = App.useApp()
  
  return {
    success: (content: string) => message.success(content),
    error: (content: string) => message.error(content),
    info: (content: string) => message.info(content),
    warning: (content: string) => message.warning(content),
  }
}

// 为了向后兼容，保留静态版本（但会有警告）
// 建议迁移到 useToast hook
import { message as messageStatic } from 'antd'
export const toast = {
  success: (content: string) => messageStatic.success(content),
  error: (content: string) => messageStatic.error(content),
  info: (content: string) => messageStatic.info(content),
  warning: (content: string) => messageStatic.warning(content),
}

