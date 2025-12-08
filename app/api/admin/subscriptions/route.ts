import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

/**
 * 获取订阅列表（管理员）
 * GET /api/admin/subscriptions?page=1&pageSize=10&search=xxx&status=all|active|expired
 */
export const GET = withAdmin(async (request: NextRequest, userId: string) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, active, expired

    // 构建查询条件
    const where: any = {}

    // 搜索条件（用户邮箱或姓名）
    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    // 状态筛选
    const now = new Date()
    if (status === 'active') {
      where.expiresAt = { gt: now }
      where.status = 'active'
    } else if (status === 'expired') {
      where.OR = [
        { expiresAt: { lte: now } },
        { status: 'expired' }
      ]
    }

    // 获取总数
    const total = await db.subscription.count({ where })

    // 获取订阅列表
    const subscriptions = await db.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            banned: true,
            subscriptionExpiresAt: true
          }
        },
        activationCode: {
          select: {
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // 格式化数据
    const formattedSubscriptions = subscriptions.map(sub => {
      const isExpired = sub.expiresAt < now || sub.status === 'expired'
      
      // 订阅状态只根据过期时间判断（与账号禁用状态无关）
      let subscriptionState: 'active' | 'expired' = isExpired ? 'expired' : 'active'

      return {
        id: sub.id,
        userId: sub.userId,
        user: {
          email: sub.user.email,
          name: sub.user.name,
          banned: sub.user.banned
        },
        activationCode: sub.activationCode.code,
        startAt: sub.startAt,
        expiresAt: sub.expiresAt,
        status: sub.status,
        subscriptionState,
        createdAt: sub.createdAt
      }
    })

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: formattedSubscriptions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Failed to get subscriptions:', error)
    return NextResponse.json(
      { error: '获取订阅列表失败' },
      { status: 500 }
    )
  }
})

