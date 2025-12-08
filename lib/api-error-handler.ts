import { useAuthStore } from './store'

/**
 * 处理 API 错误响应
 * 如果账号被禁用，清除认证信息并跳转到登录页
 */
export async function handleApiError(response: Response): Promise<{ error: string; code?: string }> {
  const data = await response.json().catch(() => ({ error: '请求失败' }))
  
  // 检查是否是账号被禁用的错误
  if (data.code === 'ACCOUNT_BANNED' || (response.status === 403 && data.error?.includes('禁用'))) {
    // 清除认证信息
    if (typeof window !== 'undefined') {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      
      // 显示错误消息
      if (window.location.pathname !== '/login') {
        // 延迟跳转，确保消息能显示
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      }
    }
    
    return {
      error: data.error || '账号已被禁用',
      code: 'ACCOUNT_BANNED'
    }
  }
  
  return {
    error: data.error || '请求失败',
    code: data.code
  }
}

/**
 * 封装 fetch，自动处理账号被禁用的情况
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== 'undefined' 
    ? (localStorage.getItem('token') || useAuthStore.getState().token)
    : null

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  // 如果不是成功响应，检查是否是账号被禁用
  if (!response.ok) {
    const errorData = await handleApiError(response)
    throw new Error(JSON.stringify(errorData))
  }

  return response
}

