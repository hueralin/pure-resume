'use client'

import { useState } from 'react'
import { Card, Tag, Button, Table, Modal, Descriptions } from 'antd'
import { SafetyCertificateOutlined, ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons'
import { ActivationForm } from '@/components/subscription/activation-form'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

interface ProfileClientProps {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    subscriptionExpiresAt: string | null
    createdAt: string
  }
  subscriptions: Array<{
    id: string
    code: string
    startAt: string
    expiresAt: string
    status: string
    createdAt: string
  }>
}

export function ProfileClient({ user, subscriptions }: ProfileClientProps) {
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false)
  const router = useRouter()
  const { clearAuth } = useAuthStore()

  const isSubActive = user.subscriptionExpiresAt 
    ? new Date(user.subscriptionExpiresAt) > new Date() 
    : false

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const columns = [
    {
      title: '激活码',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <span className="font-mono">{text}</span>
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      key: 'startAt',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: { expiresAt: string }) => {
        const isExpired = new Date(record.expiresAt) < new Date()
        return (
          <Tag color={isExpired ? 'default' : 'green'}>
            {isExpired ? '已过期' : '生效中'}
          </Tag>
        )
      }
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-[140px] py-[24px] min-w-[1000px]">
        <div className="flex justify-between items-center mb-[24px]">
           <div className="flex items-center">
               <h1 className="text-[36px] font-normal text-foreground m-0">个人中心</h1>
            </div>
           <div className="flex items-center gap-3">
             <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
             <Button icon={<LogoutOutlined />} onClick={handleLogout} />
           </div>
        </div>

        <div className="flex flex-col gap-8">
          <Card title="基本资料" className="shadow-sm">
             <Descriptions layout="vertical" column={{ xxl: 4, xl: 4, lg: 4, md: 4, sm: 2, xs: 1 }}>
               <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
               <Descriptions.Item label="昵称">{user.name || '-'}</Descriptions.Item>
               <Descriptions.Item label="注册时间">
                  {new Date(user.createdAt).toLocaleString()}
               </Descriptions.Item>
               <Descriptions.Item label="角色">
                 {user.role === 'admin' ? '管理员' : '普通用户'}
               </Descriptions.Item>
             </Descriptions>
           </Card>

          <Card 
            title={<div className="flex items-center gap-2">订阅管理</div>} 
            className="shadow-sm"
          >
            {/* 订阅状态区域 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-full ${isSubActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                   <SafetyCertificateOutlined className="text-2xl" />
                 </div>
                 <div>
                   <div className="text-lg font-medium mb-1 flex items-center gap-2">
                     {isSubActive ? '订阅生效中' : '订阅已过期/未激活'}
                     <Tag color={isSubActive ? 'green' : 'red'}>
                        {isSubActive ? '会员' : '非会员'}
                     </Tag>
                   </div>
                   {user.subscriptionExpiresAt ? (
                      <div className="text-sm text-gray-500">
                        有效期至 {new Date(user.subscriptionExpiresAt).toLocaleString()}
                      </div>
                   ) : (
                     <div className="text-sm text-gray-500">
                       您还未开通订阅，无法享受会员权益
                     </div>
                   )}
                 </div>
              </div>
              
              <Button 
                type="primary" 
                size="large"
                onClick={() => setIsActivationModalOpen(true)}
              >
                {isSubActive ? '续费订阅' : '激活订阅'}
              </Button>
            </div>

            {/* 订阅记录表格 */}
            <div className="mt-6">
              <h3 className="text-base font-medium mb-4">订阅记录</h3>
              <Table 
                dataSource={subscriptions} 
                columns={columns} 
                rowKey="id"
                pagination={false}
                scroll={{ x: true }}
              />
            </div>
          </Card>
        </div>

        <Modal
          title="激活/续费订阅"
          open={isActivationModalOpen}
          onCancel={() => setIsActivationModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <ActivationForm onSuccess={() => {
            setIsActivationModalOpen(false)
            router.refresh() // 刷新页面以获取最新数据
          }} />
        </Modal>
      </div>
    </div>
  )
}
