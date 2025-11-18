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
import { Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ResumeEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('id')
  const { currentResume, currentResumeId, currentResumeTitle, updateModuleData, setCurrentResume } = useResumeStore()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0)
  const [resumeTitle, setResumeTitle] = useState('我的简历')
  const selectedModule = currentResume?.modules[selectedModuleIndex]

  const moduleConfig = useMemo(() => {
    if (!selectedModule) return null
    return getModuleConfig(selectedModule.moduleId)
  }, [selectedModule])

  // 加载简历数据
  useEffect(() => {
    const loadResume = async () => {
      if (!resumeId || currentResumeId === resumeId) return

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
  }, [resumeId, currentResumeId, token, router, setCurrentResume])

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
  }

  const handleSave = async () => {
    if (!currentResume) return

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      if (!authToken) {
        alert('请先登录')
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
      alert('保存成功')
      router.push('/dashboard')
    } catch (error: any) {
      alert(error.message || '保存失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* 左侧编辑区 */}
      <div className="w-1/3 border-r overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">编辑简历</h1>
          <Button onClick={handleSave} disabled={!currentResume}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resume-title">简历名称</Label>
          <Input
            id="resume-title"
            value={resumeTitle}
            onChange={(e) => setResumeTitle(e.target.value)}
            placeholder="请输入简历名称"
            className="w-full"
          />
        </div>

        <ModuleList />

        {currentResume && currentResume.modules.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">选择模块编辑：</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedModuleIndex}
              onChange={(e) => setSelectedModuleIndex(Number(e.target.value))}
            >
              {currentResume.modules.map((module, index) => {
                const config = getModuleConfig(module.moduleId)
                return (
                  <option key={module.instanceId} value={index}>
                    {config?.name || module.moduleId}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {selectedModule && moduleConfig && (
          <Card className="p-6">
            <DynamicForm
              moduleConfig={moduleConfig}
              initialData={selectedModule.data}
              onChange={handleFormChange(selectedModule.instanceId)}
            />
          </Card>
        )}
      </div>

      {/* 右侧预览区 */}
      <div className="flex-1 overflow-y-auto bg-muted p-6">
        <div className="max-w-4xl mx-auto">
          <ResumePreview />
        </div>
      </div>
    </div>
  )
}


