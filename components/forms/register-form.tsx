'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, Form } from 'antd'
import { useAuthStore } from '@/lib/store'
type RegisterFormData = {
  email: string
  password: string
  name?: string
}

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  const [form] = Form.useForm<RegisterFormData>()

  const onSubmit = async (values: RegisterFormData) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '注册失败')
        return
      }

      // 保存认证信息
      setAuth(result.user, result.token)
      
      // 跳转到简历列表
      router.push('/resume')
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card 
      title="注册账号" 
      className="w-full max-w-[400px]"
      styles={{
        body: { padding: '24px' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        className="space-y-4"
      >
        <Form.Item
          label="邮箱"
          name="email"
          rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          validateStatus={error ? 'error' : ''}
        >
          <Input
            placeholder="your@email.com"
            type="email"
            size="large"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          validateStatus={error ? 'error' : ''}
        >
          <Input.Password
            placeholder="至少6位"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="姓名（可选）"
          name="name"
        >
          <Input
            placeholder="您的姓名"
            type="text"
            size="large"
            allowClear
          />
        </Form.Item>

        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        <Form.Item>
          <Button 
            type="primary"
            htmlType="submit"
            block
            loading={loading}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </Form.Item>

        <div className="text-center text-sm text-gray-500">
          已有账号？{' '}
          <a href="/login" className="text-blue-500 hover:underline font-medium">
            立即登录
          </a>
        </div>
      </Form>
    </Card>
  )
}

