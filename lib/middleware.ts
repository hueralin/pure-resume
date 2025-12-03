import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { db } from './db'

export async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  return payload
}

export function withAuth(
  handler: (request: NextRequest, userId: string, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    return handler(request, user.userId, context)
  }
}

/**
 * 管理员权限检查中间件
 */
export function withAdmin(
  handler: (request: NextRequest, userId: string, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    // 检查用户角色
    const userRecord = await db.user.findUnique({
      where: { id: user.userId },
      select: { role: true }
    })

    if (!userRecord || userRecord.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足，需要管理员权限' },
        { status: 403 }
      )
    }

    return handler(request, user.userId, context)
  }
}

