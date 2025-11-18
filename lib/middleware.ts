import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

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

