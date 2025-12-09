'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button, Input, App, Modal } from 'antd'
import { LogoutOutlined, FullscreenOutlined, FullscreenExitOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { useToast } from '@/lib/toast'
import { ThemeToggle } from '@/components/theme-toggle'
import { ResumeCard } from '@/components/resume/resume-card'
import { AddResumeCard } from '@/components/resume/add-resume-card'
import { ResumeListSkeleton } from '@/components/resume/resume-list-skeleton'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { SubscriptionButton } from '@/components/subscription/subscription-button'

interface Resume {
  id: string
  title: string
  updatedAt: string
}

export default function ResumeListPage() {
  const { modal } = App.useApp()
  const toast = useToast()
  const router = useRouter()
  const { token, clearAuth, user } = useAuthStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  
  // 新建简历相关状态
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newResumeTitle, setNewResumeTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchResumes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router])

  const handleApiError = async (response: Response): Promise<boolean> => {
    if (!response.ok) {
      const error = await response.json()
      
      // 处理账号被禁用
      if (error.code === 'ACCOUNT_BANNED') {
        clearAuth()
        modal.error({
          title: '账号已被禁用',
          content: error.error || '您的账号已被禁用，无法使用此功能。',
          onOk: () => {
            router.push('/login')
          }
        })
        return true
      }
    }
    return false
  }

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (await handleApiError(response)) {
        return
      }

      if (response.ok) {
        const data = await response.json()
        setResumes(data)
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleCreateNew = () => {
    setNewResumeTitle('')
    setIsCreateOpen(true)
  }

  const handleCreateConfirm = async () => {
    if (!newResumeTitle.trim()) {
      toast.error('请输入简历名称')
      return
    }

    setIsCreating(true)
    try {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
        if (!authToken) {
          toast.error('请先登录')
          return
        }

        const response = await fetch('/api/resumes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: newResumeTitle,
            data: { modules: [] }, // 初始为空模块列表
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          
          // 处理账号被禁用
          if (error.code === 'ACCOUNT_BANNED') {
            clearAuth()
            modal.error({
              title: '账号已被禁用',
              content: error.error || '您的账号已被禁用，无法使用此功能。',
              onOk: () => {
                router.push('/login')
              }
            })
            return
          }
          
          throw new Error(error.error || '创建失败')
        }

        await response.json()
        toast.success('创建成功')
        setIsCreateOpen(false)
        setNewResumeTitle('')
        setIsCreating(false)
        // 刷新简历列表
        await fetchResumes()
    } catch (error) {
       toast.error(error instanceof Error ? error.message : '创建失败，请稍后重试')
       setIsCreating(false)
    }
  }

  const handleDownload = async (resumeId: string): Promise<void> => {
    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      if (!authToken) {
        toast.error('请先登录')
        return
      }

      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ resumeId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '导出失败')
      }

      // 从响应头获取文件名，如果没有则使用默认名称
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `resume-${resumeId}.pdf`
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''))
        }
      }

      // 下载 PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('简历下载成功')
    } catch {
      toast.error('简历下载失败')
    }
  }

  const handleDelete = async (resumeId: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这份简历吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
          if (!authToken) {
            toast.error('请先登录')
            return
          }

          const response = await fetch(`/api/resumes/${resumeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          })

          if (await handleApiError(response)) {
            return
          }

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '删除失败')
          }

          // 从列表中移除已删除的简历
          setResumes(resumes.filter(r => r.id !== resumeId))
          toast.success('删除成功')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '删除简历失败，请稍后重试')
        }
      },
    })
  }

  if (loading) {
    return <ResumeListSkeleton />
  }

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-[140px] py-[24px] min-w-[1000px]">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-[24px]">
          <h1 className="text-[36px] font-normal text-foreground">
            我的简历
          </h1>
          <div className="flex gap-3 items-center">
            <SubscriptionButton />
            <ThemeToggle />
            <Button 
              type="default"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              title={isFullscreen ? "退出全屏" : "全屏"}
            />
            {user?.role === 'admin' && (
              <Button 
                type="default"
                icon={<SettingOutlined />}
                onClick={() => router.push('/admin')}
                title="管理后台"
              />
            )}
            <Button
              type="default"
              icon={<UserOutlined />}
              onClick={() => router.push('/profile')}
              title="个人中心"
            />
            <Button 
              type="default"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              title="退出登录"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-[13px]">
          {/* 固定的添加简历卡片 */}
          <AddResumeCard onClick={handleCreateNew} />
          
          {/* 简历列表 */}
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              id={resume.id}
              title={resume.title}
              updatedAt={resume.updatedAt}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
        
        {/* 新建简历弹窗 */}
        <Modal
          open={isCreateOpen}
          onCancel={() => setIsCreateOpen(false)}
          title="创建新简历"
          onOk={handleCreateConfirm}
          confirmLoading={isCreating}
          okText="确定"
          cancelText="取消"
        >
          <div className="mb-4 text-gray-500">
            给您的简历起个名字，例如 &ldquo;前端开发工程师&rdquo; 或 &ldquo;产品经理&rdquo;
          </div>
          <Input 
            placeholder="请输入简历名称" 
            value={newResumeTitle}
            onChange={(e) => setNewResumeTitle(e.target.value)}
            onPressEnter={() => {
              if (!isCreating) {
                handleCreateConfirm()
              }
            }}
            allowClear
            autoFocus
            size="large"
          />
        </Modal>

      </div>
    </div>
  )
}
