'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '登录失败')
        return
      }

      // 保存认证信息
      setAuth(result.user, result.token)
      
      // 跳转到简历列表
      router.push('/dashboard')
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-[400px] bg-card border-border shadow-sm">
      <CardHeader className="space-y-1 p-6 pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          登录
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          登录您的账号以继续
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="w-full h-10 bg-background border-input"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              密码
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              className="w-full h-10 bg-background border-input"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90" 
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <a href="/register" className="text-primary hover:underline font-medium">
              立即注册
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

