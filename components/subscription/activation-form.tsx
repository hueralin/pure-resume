'use client'

import { useState } from 'react'
import { Button, Input, Card, Form, message } from 'antd'
import { useAuthStore } from '@/lib/store'

// 格式化激活码输入（自动添加连字符）
function formatActivationCodeInput(value: string): string {
  // 移除所有非字母数字字符
  const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  
  // 每5个字符添加一个连字符
  const groups: string[] = []
  for (let i = 0; i < cleaned.length; i += 5) {
    groups.push(cleaned.slice(i, i + 5))
  }
  
  // 限制最多25个字符（5组）
  const limited = groups.slice(0, 5).join('-')
  
  return limited
}

export function ActivationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const token = useAuthStore((state) => state.token)
  const [form] = Form.useForm()

  const onSubmit = async (values: { code: string }) => {
    if (!token) {
      message.error('请先登录')
      return
    }

    setLoading(true)
    try {
      // 规范化激活码（去除空格，转为大写）
      const normalizedCode = values.code.replace(/\s/g, '').toUpperCase()
      
      const response = await fetch('/api/activation/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: normalizedCode })
      })

      const result = await response.json()

      if (!response.ok) {
        message.error(result.error || '激活失败')
        return
      }

      message.success(result.message || '激活成功！')
      form.resetFields()
      onSuccess?.()
    } catch (err) {
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="code"
          label="激活码"
          rules={[
            { required: true, message: '请输入激活码' },
            { 
              pattern: /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/,
              message: '激活码格式不正确，应为：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'
            }
          ]}
        >
          <Input
            placeholder="例如：ABCDE-FGHIJ-KLMNO-PQRST-UVWXY"
            size="large"
            autoComplete="off"
            maxLength={29} // 25个字符 + 4个连字符
            onChange={(e) => {
              const formatted = formatActivationCodeInput(e.target.value)
              form.setFieldsValue({ code: formatted })
            }}
            style={{ 
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="middle"
          >
            激活
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-4 text-sm text-gray-500">
        <p>• 激活码格式：25位字符，5组，每组5个字符，用连字符分隔</p>
        <p>• 激活后订阅有效期为3个月</p>
        <p>• 激活码只能使用一次</p>
        <p>• 如需购买激活码，请联系客服</p>
      </div>
    </div>
  )
}

