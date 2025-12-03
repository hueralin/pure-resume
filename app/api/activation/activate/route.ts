import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { normalizeActivationCode, validateActivationCodeFormat } from '@/lib/activation-code'
import { z } from 'zod'

const activateSchema = z.object({
  code: z.string().min(1, '请输入激活码'),
})

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json()
    const { code } = activateSchema.parse(body)

    // 规范化激活码（去除空格，转为大写）
    const normalizedCode = normalizeActivationCode(code)

    // 验证激活码格式
    if (!validateActivationCodeFormat(normalizedCode)) {
      return NextResponse.json(
        { error: '激活码格式不正确，应为：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX' },
        { status: 400 }
      )
    }

    // 查找激活码
    const activationCode = await db.activationCode.findUnique({
      where: { code: normalizedCode }
    })

    if (!activationCode) {
      return NextResponse.json(
        { error: '激活码不存在' },
        { status: 400 }
      )
    }

    // 检查是否已使用
    if (activationCode.userId) {
      return NextResponse.json(
        { error: '激活码已被使用' },
        { status: 400 }
      )
    }

    // 检查激活码是否过期（生成时的有效期）
    if (activationCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '激活码已过期' },
        { status: 400 }
      )
    }

    // 检查用户当前订阅状态
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: { activationCode: true }
    })

    // 计算新的过期时间
    // 如果用户已有未过期的订阅，从当前过期时间开始延长3个月
    // 如果用户没有订阅或已过期，从激活时开始计算3个月
    const now = new Date()
    let newExpiresAt = new Date()
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 3)

    if (existingUser?.subscriptionExpiresAt && existingUser.subscriptionExpiresAt > now) {
      // 用户有未过期的订阅，从当前过期时间延长3个月
      newExpiresAt = new Date(existingUser.subscriptionExpiresAt)
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 3)
    }

    // 如果用户已有激活码，先解除旧激活码的关联
    if (existingUser?.activationCode) {
      await db.activationCode.update({
        where: { id: existingUser.activationCode.id },
        data: {
          userId: null,
          activatedAt: null
        }
      })
    }

    // 激活新激活码
    await db.activationCode.update({
      where: { id: activationCode.id },
      data: {
        userId,
        activatedAt: new Date()
      }
    })

    // 更新用户订阅过期时间
    await db.user.update({
      where: { id: userId },
      data: { subscriptionExpiresAt: newExpiresAt }
    })

    return NextResponse.json({
      success: true,
      expiresAt: newExpiresAt,
      message: '激活成功！您的订阅将在3个月后过期'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Failed to activate code:', error)
    return NextResponse.json(
      { error: '激活失败，请稍后重试' },
      { status: 500 }
    )
  }
})

