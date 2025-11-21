'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, Form } from 'antd'
import { useAuthStore } from '@/lib/store'

type LoginFormData = {
  email: string
  password: string
}

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  const [form] = Form.useForm<LoginFormData>()

  const onSubmit = async (values: LoginFormData) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '登录失败')
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
      title="登录" 
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
          rules={[{ required: true, message: '请输入密码' }]}
          validateStatus={error ? 'error' : ''}
        >
          <Input.Password
            placeholder="请输入密码"
            size="large"
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
            {loading ? '登录中...' : '登录'}
          </Button>
        </Form.Item>

        <div className="text-center text-sm text-gray-500">
          还没有账号？{' '}
          <a href="/register" className="text-blue-500 hover:underline font-medium">
            立即注册
          </a>
        </div>
      </Form>
    </Card>
  )
}

