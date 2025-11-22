'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResumePreview } from './resume-preview'
import { ResumeModuleAccordion } from './resume-module-accordion'
import { ModuleSelectDialog } from './module-select-dialog'
import { useResumeStore, useAuthStore } from '@/lib/store'
import { loadModuleConfigs } from '@/lib/modules'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { Button, Input, App } from 'antd'
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

export function ResumeEditor({ resumeId: propResumeId }: { resumeId?: string }) {
  const { modal } = App.useApp()
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = propResumeId || searchParams.get('id')
  const { currentResume, currentResumeId, currentResumeTitle, setCurrentResume, clearResume, addModule, removeModule, reorderModules } = useResumeStore()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [resumeTitle, setResumeTitle] = useState('我的简历')
  const [isDirty, setIsDirty] = useState(false)
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  const [titleError, setTitleError] = useState<string>('')
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  const moduleConfigs = useMemo(() => loadModuleConfigs(), [])
  
  const availableModules = useMemo(() => {
    if (!currentResume) return moduleConfigs

    const usedModuleIds = new Set(currentResume.modules.map(m => m.moduleId))
    return moduleConfigs.filter(config => {
      // unique 默认为 true，如果为 false 则允许重复添加
      const isUnique = config.unique !== false
      if (!isUnique) return true
      return !usedModuleIds.has(config.id)
    })
  }, [currentResume, moduleConfigs])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
      if (!resumeId || resumeId === 'new') return 
      
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
    if ((!resumeId || resumeId === 'new') && !currentResume) {
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setResumeTitle(value)
    setIsDirty(true)
    // 清除错误状态
    if (titleError && value.trim()) {
      setTitleError('')
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id && currentResume) {
      const oldIndex = currentResume.modules.findIndex(m => m.instanceId === active.id)
      const newIndex = currentResume.modules.findIndex(m => m.instanceId === over.id)
      const newModules = arrayMove(currentResume.modules, oldIndex, newIndex)
      reorderModules(newModules.map(m => m.instanceId))
      setIsDirty(true)
    }
  }

  const handleAddModule = (moduleId: string) => {
    const instanceId = `${moduleId}-${Date.now()}`
    addModule(moduleId, instanceId, {})
    setIsDirty(true)
  }

  const handleRemoveModule = (instanceId: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模块吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        removeModule(instanceId)
        setIsDirty(true)
      },
    })
  }

  const handleSave = async () => {
    if (!currentResume) return

    // 校验简历名称
    const trimmedTitle = resumeTitle.trim()
    if (!trimmedTitle) {
      setTitleError('请输入简历名称')
      toast.error('请输入简历名称')
      return
    }
    setTitleError('')

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
          title: trimmedTitle,
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
      
      if (!resumeId || resumeId === 'new') {
        router.replace(`/resume/${savedResume.id}`)
      }
    } catch (error: any) {
      toast.error(error.message || '保存失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-white">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black overflow-auto" suppressHydrationWarning>
      {/* Header - 标题和保存按钮 */}
      <div className="w-[1200px] mx-auto my-6 flex justify-between items-center">
        <h1 className="text-[36px] font-normal text-white">
          编辑简历
        </h1>
        <div className="flex gap-2">
          <Button 
            type="default"
            title="返回"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          />
          <Button 
            type="default"
            title={isFullscreen ? "退出全屏" : "全屏"}
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
          <Button 
            type="default"
            title="保存"
            icon={<SaveOutlined />}
            onClick={handleSave} 
            disabled={!currentResume}
          />
        </div>
      </div>

      {/* 整体容器，左侧留出 40px 边距，上边距 100px */}
      <div className="flex w-[1200px] mx-auto" style={{ height: 'calc(100vh - 150px)' }}>
        {/* 左侧编辑区 */}
        <div className="w-[450px] flex flex-col h-full pt-4 pb-4 pl-4 pr-4 bg-[#27272A] rounded">
          {/* 简历名称 */}
          <div className="mb-6 flex-shrink-0">
            <label htmlFor="resume-title" className="text-sm font-medium text-white mb-2 block">
              简历名称 <span className="text-red-500">*</span>
            </label>
            <Input
              id="resume-title"
              value={resumeTitle}
              onChange={handleTitleChange}
              placeholder="请输入简历名称"
              allowClear
              className="w-full"
              status={titleError ? 'error' : ''}
              style={{ background: '#09090B', borderColor: titleError ? '#ff4d4f' : '#27272A', color: 'white' }}
            />
            {titleError && (
              <div className="text-sm text-red-500 mt-1">{titleError}</div>
            )}
          </div>

          {/* 简历模块 */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-shrink-0">
              <h2 className="text-sm font-medium text-white mb-2">简历模块</h2>
              
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => setIsModuleDialogOpen(true)}
                block
                className="mb-2 !h-12"
                style={{ background: '#09090B', borderColor: '#27272A', color: 'white' }}
              >
                添加模块
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-outside">
              {currentResume && currentResume.modules.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={currentResume.modules.map(m => m.instanceId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ResumeModuleAccordion
                      modules={currentResume.modules}
                      onRemove={handleRemoveModule}
                    />
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-sm text-[#A1A1AA]">
                  暂无模块，点击 &ldquo;添加模块&rdquo; 开始编辑
                </div>
              )}
            </div>
          </div>

          <ModuleSelectDialog
            open={isModuleDialogOpen}
            onOpenChange={setIsModuleDialogOpen}
            modules={availableModules}
            onSelect={handleAddModule}
          />
        </div>

        {/* 右侧预览区 */}
        <div className="flex flex-col h-full overflow-y-auto scrollbar-outside bg-black rounded" style={{ width: '750px', marginLeft: '30px' }}>
          <ResumePreview />
        </div>
      </div>
    </div>
  )
}
