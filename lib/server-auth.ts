import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import { db } from './db'

/**
 * 在服务端组件中获取当前用户
 * 从 cookies 中读取 token
 */
export async function getServerUser() {
  // 从 cookies 获取 token
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  // 获取用户完整信息
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  return user
}

/**
 * 检查当前用户是否是管理员
 */
export async function checkAdmin() {
  const user = await getServerUser()
  return user?.role === 'admin'
}

