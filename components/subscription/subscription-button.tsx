'use client'

import { useEffect, useState } from 'react'
import { Button, Modal, Tag } from 'antd'
import { KeyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/lib/store'
import { ActivationForm } from './activation-form'

interface SubscriptionStatus {
  valid: boolean
  state: 'none' | 'expired' | 'valid'
  expiresAt: string | null
  daysLeft: number | null
}

export function SubscriptionButton() {
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

  if (!token || loading) {
    return null
  }

  // 没有订阅或已过期 - 显示激活按钮
  if (!status || status.state === 'none' || status.state === 'expired') {
    return (
      <>
        <Button
          type="primary"
          icon={<KeyOutlined />}
          onClick={() => setShowActivationForm(true)}
          style={{
            background: status?.state === 'expired' 
              ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            fontWeight: 500
          }}
        >
          {status?.state === 'expired' ? '续费订阅' : '激活订阅'}
        </Button>
        <Modal
          open={showActivationForm}
          onCancel={() => setShowActivationForm(false)}
          footer={null}
          title={status?.state === 'expired' ? '续费订阅' : '激活订阅'}
          width={500}
        >
          <ActivationForm
            onSuccess={() => {
              setShowActivationForm(false)
              fetchStatus()
            }}
          />
        </Modal>
      </>
    )
  }

  // 有订阅且有效 - 显示到期时间
  const daysLeft = status.daysLeft ?? 0
  const isExpiringSoon = daysLeft <= 7

  return (
    <Tag
      icon={<CheckCircleOutlined />}
      color={isExpiringSoon ? 'orange' : 'green'}
      style={{
        padding: '4px 12px',
        marginRight: '0',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '24px',
        borderRadius: '4px',
        border: 'none'
      }}
    >
      {isExpiringSoon ? (
        <span>剩余 {daysLeft} 天</span>
      ) : (
        <span>
          到期：{status.expiresAt ? new Date(status.expiresAt).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : '未知'}
        </span>
      )}
    </Tag>
  )
}

