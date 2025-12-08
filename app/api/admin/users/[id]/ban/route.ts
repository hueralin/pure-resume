import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

const banSchema = z.object({
  banned: z.boolean() // true=禁用, false=启用
})

/**
 * 禁用/启用用户账号（管理员）
 * POST /api/admin/users/[id]/ban
 * Body: { banned: true | false }
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
    const { banned } = banSchema.parse(body)
    const { id: targetUserId } = await params

    // 不能禁用自己
    if (targetUserId === authUser.userId) {
      return NextResponse.json(
        { error: '不能禁用自己' },
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

    // 不能禁用其他管理员
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: '不能禁用管理员' },
        { status: 403 }
      )
    }

    // 更新账号禁用状态
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: {
        banned: banned
      },
      select: {
        id: true,
        email: true,
        banned: true,
        subscriptionExpiresAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: banned ? '账号已禁用' : '账号已启用',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        banned: updatedUser.banned,
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

