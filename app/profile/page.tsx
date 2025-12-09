import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server-auth'
import { db } from '@/lib/db'
import { ProfileClient } from './profile-client'

export const metadata: Metadata = {
  title: '个人中心',
}

export default async function ProfilePage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  // 获取完整用户订阅信息
  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionExpiresAt: true,
      createdAt: true
    }
  })

  if (!fullUser) {
    redirect('/login')
  }

  // 获取订阅历史
  const subscriptions = await db.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      activationCode: true
    }
  })

  // 序列化日期对象，避免传给 Client Component 时报错
  const serializedUser = {
    ...fullUser,
    subscriptionExpiresAt: fullUser.subscriptionExpiresAt?.toISOString() || null,
    createdAt: fullUser.createdAt.toISOString()
  }

  const serializedSubscriptions = subscriptions.map(sub => ({
    id: sub.id,
    code: sub.activationCode.code,
    startAt: sub.startAt.toISOString(),
    expiresAt: sub.expiresAt.toISOString(),
    status: sub.status,
    createdAt: sub.createdAt.toISOString()
  }))

  return (
    <ProfileClient 
      user={serializedUser} 
      subscriptions={serializedSubscriptions} 
    />
  )
}

