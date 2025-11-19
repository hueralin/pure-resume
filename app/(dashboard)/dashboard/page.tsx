'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, LogOut, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'

interface Resume {
  id: string
  title: string
  updatedAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, token, clearAuth } = useAuthStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null)

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
    router.push('/editor')
  }

  const handleEdit = (id: string) => {
    router.push(`/editor?id=${id}`)
  }

  const handleDownload = async (e: React.MouseEvent, resumeId: string) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发卡片点击
    
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
        throw new Error('导出失败')
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

  const handleDelete = async (e: React.MouseEvent, resumeId: string, resumeTitle: string) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发卡片点击
    
    // 使用 toast 确认删除
    toast(`确定要删除简历"${resumeTitle}"吗？`, {
      description: '此操作无法撤销',
      action: {
        label: '删除',
        onClick: async () => {
          setDeletingResumeId(resumeId)
          
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
          } finally {
            setDeletingResumeId(null)
          }
        },
      },
      cancel: {
        label: '取消',
        onClick: () => {},
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              我的简历
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              欢迎，{user?.name || user?.email}
            </p>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button 
              onClick={handleCreateNew}
              className="bg-primary text-primary-foreground hover:bg-primary/90 border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建简历
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>

        {resumes.length === 0 ? (
          <Card className="bg-card border-border shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="mb-6 text-sm text-muted-foreground">还没有简历，创建一个吧</p>
              <Button 
                onClick={handleCreateNew}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建简历
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="group relative cursor-pointer transition-all duration-200 hover:scale-[1.01] bg-card border border-border rounded overflow-hidden hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                onClick={() => handleEdit(resume.id)}
              >
                <div className="p-5">
                  <h3 className="font-medium mb-2 text-foreground text-base leading-snug">
                    {resume.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    更新于 {new Date(resume.updatedAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>

                {/* 悬浮操作按钮 */}
                <div 
                  className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleDownload(e, resume.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="下载PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, resume.id, resume.title)}
                    disabled={deletingResumeId === resume.id}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="删除简历"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

