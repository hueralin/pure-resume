import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { checkSubscription } from '@/lib/subscription'

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const status = await checkSubscription(userId)
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Failed to get subscription status:', error)
    return NextResponse.json(
      { error: '获取订阅状态失败' },
      { status: 500 }
    )
  }
})

