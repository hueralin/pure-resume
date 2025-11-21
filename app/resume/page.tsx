'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ResumeCard } from '@/components/resume/resume-card'
import { AddResumeCard } from '@/components/resume/add-resume-card'

interface Resume {
  id: string
  title: string
  updatedAt: string
}

export default function ResumeListPage() {
  const router = useRouter()
  const { token, clearAuth } = useAuthStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  
  // 新建简历相关状态
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newResumeTitle, setNewResumeTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchResumes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

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

  const handleCreateConfirm = async (e: React.MouseEvent) => {
    e.preventDefault() // 阻止默认关闭行为
    
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

  const handleDownload = async (resumeId: string) => {
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

      // 下载 PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume-${resumeId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF 导出成功')
    } catch {
      toast.error('导出PDF失败，请稍后重试')
    }
  }

  const handleDelete = async (resumeId: string) => {
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
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-[140px] py-[24px] min-w-[1000px]">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-[24px]">
          <h1 className="text-[36px] font-normal text-foreground">
            我的简历
          </h1>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button 
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-[13px] min-w-[1000px]">
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
        <AlertDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>创建新简历</AlertDialogTitle>
              <AlertDialogDescription>
                给您的简历起个名字，例如&ldquo;前端开发工程师&rdquo;或&ldquo;产品经理&rdquo;
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="resume-name">简历名称</Label>
                <Input 
                  id="resume-name" 
                  placeholder="请输入简历名称" 
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleCreateConfirm(e as unknown as React.MouseEvent)
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCreating}>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateConfirm} disabled={isCreating} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isCreating ? '创建中...' : '确定'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  )
}
