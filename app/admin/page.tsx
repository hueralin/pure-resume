import { notFound } from 'next/navigation'
import { checkAdmin } from '@/lib/server-auth'
import { AdminClient } from './admin-client'

export default async function AdminPage() {
  // 在服务端检查管理员权限
  const isAdmin = await checkAdmin()

  // 如果不是管理员，返回 404
  if (!isAdmin) {
    notFound()
  }

  // 如果是管理员，渲染客户端组件
  return <AdminClient />
}
