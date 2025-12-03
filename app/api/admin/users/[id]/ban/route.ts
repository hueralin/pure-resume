import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

const banSchema = z.object({
  status: z.number().int().min(0).max(1) // 0=禁用, 1=启用
})

/**
 * 禁用/启用用户订阅（管理员）
 * POST /api/admin/users/[id]/ban
 * Body: { status: 0 | 1 }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查管理员权限
    const authUser = await import('@/lib/middleware').then(m => m.getAuthUser(request))
    if (!authUser) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    // 检查用户角色
    const userRecord = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true }
    })

    if (!userRecord || userRecord.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足，需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status } = banSchema.parse(body)
    const { id: targetUserId } = await params

    // 不能禁用自己
    if (targetUserId === authUser.userId) {
      return NextResponse.json(
        { error: '不能禁用自己的订阅' },
        { status: 400 }
      )
    }

    // 检查目标用户是否存在
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 不能禁用其他管理员的订阅
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: '不能禁用管理员的订阅' },
        { status: 403 }
      )
    }

    // 更新订阅状态
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: {
        subscriptionStatus: status
      },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: status === 0 ? '订阅已禁用' : '订阅已启用',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Failed to ban/unban user subscription:', error)
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}

