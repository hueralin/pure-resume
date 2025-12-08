import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

/**
 * 获取用户列表（管理员）
 * GET /api/admin/users?page=1&pageSize=10&search=xxx&status=all|valid|expired|banned
 */
export const GET = withAdmin(async (request: NextRequest, userId: string) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, valid, expired, banned

    // 构建查询条件
    const where: any = {}

    // 搜索条件（邮箱或姓名）
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 状态筛选
    const now = new Date()
    if (status === 'valid') {
      where.banned = false
      where.subscriptionExpiresAt = { gt: now }
    } else if (status === 'expired') {
      where.banned = false
      where.subscriptionExpiresAt = { lte: now }
    } else if (status === 'banned') {
      where.banned = true
    } else if (status === 'none') {
      where.banned = false
      where.subscriptionExpiresAt = null
    }

    // 获取总数
    const total = await db.user.count({ where })

    // 获取用户列表
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionExpiresAt: true,
        banned: true,
        createdAt: true,
        _count: {
          select: {
            resumes: true
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
    const formattedUsers = users.map(user => {
      const now = new Date()
      let subscriptionState: 'none' | 'valid' | 'expired' = 'none'
      
      // 订阅状态只根据过期时间判断（与账号禁用状态无关）
      if (user.subscriptionExpiresAt) {
        subscriptionState = user.subscriptionExpiresAt > now ? 'valid' : 'expired'
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        banned: user.banned,
        subscriptionState,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        resumeCount: user._count.resumes,
        createdAt: user.createdAt
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Failed to get users:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
})

