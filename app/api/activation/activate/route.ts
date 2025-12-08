import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { normalizeActivationCode, validateActivationCodeFormat } from '@/lib/activation-code'
import { calculateSubscriptionExpiresAt, getSubscriptionDurationDays, getSubscriptionDurationDescription } from '@/lib/subscription-config'
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
      where: { code: normalizedCode },
      include: { subscription: true }
    })

    if (!activationCode) {
      return NextResponse.json(
        { error: '激活码不存在' },
        { status: 400 }
      )
    }

    // 检查是否已使用（通过 subscription 关联判断）
    if (activationCode.subscription) {
      return NextResponse.json(
        { error: '激活码已被使用' },
        { status: 400 }
      )
    }

    // 检查用户当前订阅状态
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { expiresAt: 'desc' },
          take: 1
        }
      }
    })

    // 计算新的过期时间
    // 如果用户已有未过期的订阅，从当前过期时间开始延长
    // 如果用户没有订阅或已过期，从激活时开始计算
    const now = new Date()
    const startAt = new Date()
    const subscriptionDurationDays = getSubscriptionDurationDays()
    let expiresAt: Date
    let isRenewal = false

    if (existingUser?.subscriptionExpiresAt && existingUser.subscriptionExpiresAt > now) {
      // 用户有未过期的订阅，从当前过期时间延长（续费）
      isRenewal = true
      expiresAt = calculateSubscriptionExpiresAt(existingUser.subscriptionExpiresAt, subscriptionDurationDays)
    } else {
      // 用户没有订阅或已过期，从激活时开始计算（新订阅）
      expiresAt = calculateSubscriptionExpiresAt(startAt, subscriptionDurationDays)
    }

    // 创建订阅记录
    const subscription = await db.subscription.create({
      data: {
        userId,
        activationCodeId: activationCode.id,
        startAt,
        expiresAt,
        status: 'active'
      }
    })

    // 更新用户订阅过期时间（冗余字段，方便快速查询）
    await db.user.update({
      where: { id: userId },
      data: { subscriptionExpiresAt: expiresAt }
    })

    // 格式化过期时间
    const expiresAtFormatted = expiresAt.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    const durationDescription = getSubscriptionDurationDescription()
    const message = isRenewal
      ? `续费成功！您的订阅已延长${durationDescription}，新的到期时间为：${expiresAtFormatted}`
      : `激活成功！您的订阅将在${durationDescription}后过期，到期时间为：${expiresAtFormatted}`

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt,
      isRenewal,
      message
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // 处理唯一约束冲突（激活码已被使用）
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: '激活码已被使用' },
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
