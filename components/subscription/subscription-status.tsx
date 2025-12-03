'use client'

import { useEffect, useState } from 'react'
import { Card, Button, Tag, Alert } from 'antd'
import { useAuthStore } from '@/lib/store'
import { ActivationForm } from './activation-form'

interface SubscriptionStatus {
  valid: boolean
  state: 'none' | 'expired' | 'valid'  // 订阅状态：none=无订阅, expired=已过期, valid=有效
  expiresAt: string | null
  daysLeft: number | null
}

export function SubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActivationForm, setShowActivationForm] = useState(false)
  const token = useAuthStore((state) => state.token)

  const fetchStatus = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch subscription status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [token])

  if (!token) {
    return null
  }

  if (loading) {
    return <Card loading={true} />
  }

  if (!status) {
    return (
      <Card title="订阅状态">
        <Alert
          message="未激活"
          description="您还没有激活订阅，请使用激活码激活后使用完整功能。"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => setShowActivationForm(true)}>
              激活
            </Button>
          }
        />
        {showActivationForm && (
          <div className="mt-4">
            <ActivationForm onSuccess={() => {
              setShowActivationForm(false)
              fetchStatus()
            }} />
          </div>
        )}
      </Card>
    )
  }

  // 根据 state 字段区分无订阅和已过期
  if (status.state === 'none') {
    return (
      <Card title="订阅状态">
        <Alert
          message="未激活"
          description="您还没有激活订阅，请使用激活码激活后使用完整功能。"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => setShowActivationForm(true)}>
              激活
            </Button>
          }
        />
        {showActivationForm && (
          <div className="mt-4">
            <ActivationForm onSuccess={() => {
              setShowActivationForm(false)
              fetchStatus()
            }} />
          </div>
        )}
      </Card>
    )
  }

  if (status.state === 'expired') {
    return (
      <Card title="订阅状态">
        <Alert
          message="订阅已过期"
          description={
            status.expiresAt
              ? `您的订阅已于 ${new Date(status.expiresAt).toLocaleDateString()} 过期。过期后您只能导出PDF或删除简历，无法创建或编辑简历。`
              : '您的订阅已过期，请使用激活码续费。'
          }
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => setShowActivationForm(true)}>
              续费
            </Button>
          }
        />
        {showActivationForm && (
          <div className="mt-4">
            <ActivationForm onSuccess={() => {
              setShowActivationForm(false)
              fetchStatus()
            }} />
          </div>
        )}
      </Card>
    )
  }

  const daysLeft = status.daysLeft ?? 0
  const isExpiringSoon = daysLeft <= 7

  return (
    <Card title="订阅状态">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag color={isExpiringSoon ? 'orange' : 'green'}>
            {isExpiringSoon ? '即将过期' : '有效'}
          </Tag>
          <span>
            订阅有效至：{status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : '未知'}
          </span>
        </div>
        
        {isExpiringSoon && (
          <Alert
            message={`订阅将在 ${daysLeft} 天后过期`}
            description="请及时使用激活码续费，以免影响使用。"
            type="warning"
            showIcon
            className="mt-2"
            action={
              <Button size="small" onClick={() => setShowActivationForm(true)}>
                续费
              </Button>
            }
          />
        )}

        {!isExpiringSoon && (
          <div className="text-sm text-gray-500">
            剩余 {daysLeft} 天
          </div>
        )}

        {showActivationForm && (
          <div className="mt-4">
            <ActivationForm onSuccess={() => {
              setShowActivationForm(false)
              fetchStatus()
            }} />
          </div>
        )}
      </div>
    </Card>
  )
}

