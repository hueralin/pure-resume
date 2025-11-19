'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ModuleList } from './module-list'
import { DynamicForm } from '@/components/forms/dynamic-form'
import { ResumePreview } from './resume-preview'
import { useResumeStore, useAuthStore } from '@/lib/store'
import { getModuleConfig } from '@/lib/modules'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'

export function ResumeEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('id')
  const { currentResume, currentResumeId, currentResumeTitle, updateModuleData, setCurrentResume, clearResume } = useResumeStore()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0)
  const [resumeTitle, setResumeTitle] = useState('我的简历')
  const [isDirty, setIsDirty] = useState(false)
  const selectedModule = currentResume?.modules[selectedModuleIndex]

  const moduleConfig = useMemo(() => {
    if (!selectedModule) return null
    return getModuleConfig(selectedModule.moduleId)
  }, [selectedModule])

  // 加载前先清理（如果是进入新ID或创建新简历）
  useEffect(() => {
    if (!resumeId && !currentResumeId) {
      clearResume()
    }
    // 如果 currentResumeId 存在但与 URL 中的不匹配，也清理
    if (resumeId && currentResumeId && currentResumeId !== resumeId) {
      clearResume()
    }
  }, [resumeId, currentResumeId, clearResume])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearResume()
    }
  }, [clearResume])

  // 监听未保存更改
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // 加载简历数据
  useEffect(() => {
    const loadResume = async () => {
      // 如果已经有当前简历且ID匹配，则不重新加载（除非是为了刷新）
      // 但为了解决用户反馈的“脏数据”问题，我们应该强制加载
      if (!resumeId) return 

      if (currentResumeId === resumeId && !isDirty) return

      try {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
        if (!authToken) {
          router.push('/login')
          return
        }

        setLoading(true)
        const response = await fetch(`/api/resumes/${resumeId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })

        if (response.ok) {
          const resume = await response.json()
          setCurrentResume(resume.data, resume.id, resume.title)
          setResumeTitle(resume.title || '我的简历')
          setIsDirty(false) // 加载后重置脏状态
        } else {
          // 如果简历不存在，初始化空简历
          setCurrentResume({ modules: [] }, null, null)
        }
      } catch (error) {
        console.error('Failed to load resume:', error)
        setCurrentResume({ modules: [] }, null, null)
      } finally {
        setLoading(false)
      }
    }

    loadResume()
  }, [resumeId, token, router, setCurrentResume]) // 移除 currentResumeId 依赖，防止循环调用

  // 如果没有 resumeId 且没有当前简历，初始化空简历
  useEffect(() => {
    if (!resumeId && !currentResume) {
      setCurrentResume({ modules: [] }, null, null)
      setResumeTitle('我的简历')
    }
  }, [resumeId, currentResume, setCurrentResume])

  // 当 currentResumeTitle 变化时，更新本地状态
  useEffect(() => {
    if (currentResumeTitle) {
      setResumeTitle(currentResumeTitle)
    }
  }, [currentResumeTitle])

  const handleFormChange = (instanceId: string) => (data: Record<string, any>) => {
    updateModuleData(instanceId, data)
    setIsDirty(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeTitle(e.target.value)
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!currentResume) return

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      if (!authToken) {
        toast.error('请先登录')
        router.push('/login')
        return
      }

      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          resumeId: currentResumeId,
          title: resumeTitle || '我的简历',
          data: currentResume,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存失败')
      }

      const savedResume = await response.json()
      setCurrentResume(currentResume, savedResume.id, savedResume.title)
      setIsDirty(false) // 保存成功后重置脏状态
      toast.success('保存成功')
      
      if (!resumeId) {
        router.push(`/editor?id=${savedResume.id}`)
      }
    } catch (error: any) {
      toast.error(error.message || '保存失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        {/* 左侧编辑区 Skeleton */}
        <div className="w-1/3 p-4 space-y-4 border-r border-border">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        
        {/* 右侧预览区 Skeleton */}
        <div className="flex-1 p-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-[800px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 左侧编辑区 */}
      <div className="w-1/3 overflow-y-auto p-4 space-y-4 bg-card border-r border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            编辑简历
          </h1>
          <Button 
            onClick={handleSave} 
            disabled={!currentResume}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resume-title" className="text-sm font-medium text-foreground">简历名称</Label>
          <Input
            id="resume-title"
            value={resumeTitle}
            onChange={handleTitleChange}
            placeholder="请输入简历名称"
            className="w-full h-10 bg-background border-input"
          />
        </div>

        <ModuleList />

        {currentResume && currentResume.modules.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">选择模块编辑：</Label>
            <Select
              value={selectedModuleIndex.toString()}
              onValueChange={(value) => setSelectedModuleIndex(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择要编辑的模块" />
              </SelectTrigger>
              <SelectContent>
                {currentResume.modules.map((module, index) => {
                  const config = getModuleConfig(module.moduleId)
                  return (
                    <SelectItem key={module.instanceId} value={index.toString()}>
                      {config?.name || module.moduleId}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedModule && moduleConfig && (
          <Card className="p-4 bg-card border-border">
            <DynamicForm
              moduleConfig={moduleConfig}
              initialData={selectedModule.data}
              onChange={handleFormChange(selectedModule.instanceId)}
            />
          </Card>
        )}
      </div>

      {/* 右侧预览区 */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <ResumePreview />
        </div>
      </div>
    </div>
  )
}


