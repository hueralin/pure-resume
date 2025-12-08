import { db } from './db'

export type SubscriptionState = 'none' | 'expired' | 'valid'

export interface SubscriptionStatus {
  valid: boolean
  state: SubscriptionState  // 订阅状态：none=无订阅, expired=已过期, valid=有效
  expiresAt: Date | null
  daysLeft: number | null
}

/**
 * 检查用户订阅状态
 */
export async function checkSubscription(userId: string): Promise<SubscriptionStatus> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { 
      subscriptionExpiresAt: true,
      banned: true
    }
  })

  // 如果账号被禁用，直接返回无效（但订阅状态按过期时间判断，用于显示）
  if (user?.banned) {
    const now = new Date()
    const hasValidSubscription = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
    return {
      valid: false, // 账号被禁用，无法使用
      state: hasValidSubscription ? 'valid' : (user.subscriptionExpiresAt ? 'expired' : 'none'),
      expiresAt: user.subscriptionExpiresAt,
      daysLeft: 0
    }
  }

  // 没有订阅
  if (!user?.subscriptionExpiresAt) {
    return {
      valid: false,
      state: 'none',
      expiresAt: null,
      daysLeft: null
    }
  }

  const expiresAt = user.subscriptionExpiresAt
  const now = new Date()
  const isValid = expiresAt > now
  
  // 订阅已过期
  if (!isValid) {
    return {
      valid: false,
      state: 'expired',
      expiresAt,
      daysLeft: 0
    }
  }
  
  // 订阅有效
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    valid: true,
    state: 'valid',
    expiresAt,
    daysLeft
  }
}

/**
 * 验证订阅是否有效（用于中间件）
 */
export async function requireSubscription(userId: string): Promise<{ valid: boolean; status: SubscriptionStatus }> {
  const status = await checkSubscription(userId)
  return {
    valid: status.valid,
    status
  }
}

