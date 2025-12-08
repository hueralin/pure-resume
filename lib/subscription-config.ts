/**
 * 获取订阅有效期（天数）
 * 从环境变量 SUBSCRIPTION_DURATION_DAYS 读取，默认为 30 天
 */
export function getSubscriptionDurationDays(): number {
  const envValue = process.env.SUBSCRIPTION_DURATION_DAYS
  if (envValue) {
    const days = parseInt(envValue, 10)
    if (!isNaN(days) && days > 0) {
      return days
    }
  }
  return 30 // 默认 30 天（1个月）
}

/**
 * 计算订阅过期时间
 * @param startAt 订阅开始时间
 * @param days 订阅有效期（天数），如果不提供则从环境变量读取
 */
export function calculateSubscriptionExpiresAt(startAt: Date, days?: number): Date {
  const durationDays = days ?? getSubscriptionDurationDays()
  const expiresAt = new Date(startAt)
  expiresAt.setDate(expiresAt.getDate() + durationDays)
  return expiresAt
}

/**
 * 获取订阅有效期的描述文本
 */
export function getSubscriptionDurationDescription(): string {
  const days = getSubscriptionDurationDays()
  if (days === 30) {
    return '1个月'
  } else if (days < 30) {
    return `${days}天`
  } else if (days % 30 === 0) {
    return `${days / 30}个月`
  } else {
    return `${days}天`
  }
}

