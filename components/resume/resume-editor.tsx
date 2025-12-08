'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResumePreview } from './resume-preview'
import { ResumeModuleAccordion } from './resume-module-accordion'
import { ModuleSelectDialog } from './module-select-dialog'
import { DynamicForm } from '@/components/forms/dynamic-form'
import { DynamicListForm } from '@/components/forms/dynamic-list-form'
import { ResumeEditorSkeleton } from './resume-editor-skeleton'
import { useResumeStore, useAuthStore } from '@/lib/store'
import { loadModuleConfigs } from '@/lib/modules'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { Button, Input, App } from 'antd'
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined, FullscreenOutlined, FullscreenExitOutlined, DownloadOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
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
  const [loading, setLoading] = useState(true) // 初始状态为true，显示骨架屏
  const [resumeTitle, setResumeTitle] = useState('我的简历')
  const [isDirty, setIsDirty] = useState(false)
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  const [titleError, setTitleError] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
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
      // 如果已经有当前简历且ID匹配，则不重新加载
      if (!resumeId || resumeId === 'new') {
        setLoading(false)
        return 
      }
      
      // 如果已经有数据且ID匹配，直接返回，不显示loading
      if (currentResumeId === resumeId && currentResume) {
        setLoading(false)
        return
      }

      // 需要加载时，先设置loading状态
      setLoading(true)

      try {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
        if (!authToken) {
          router.push('/login')
          setLoading(false)
          return
        }

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
          setCurrentResume({ modules: [] }, undefined, undefined)
        }
      } catch (error) {
        console.error('Failed to load resume:', error)
        setCurrentResume({ modules: [] }, undefined, undefined)
      } finally {
        setLoading(false)
      }
    }

    loadResume()
  }, [resumeId, token, router, setCurrentResume, currentResumeId, currentResume]) // 添加 currentResume 依赖

  // 如果没有 resumeId 且没有当前简历，初始化空简历
  useEffect(() => {
    if ((!resumeId || resumeId === 'new') && !currentResume) {
      setCurrentResume({ modules: [] }, undefined, undefined)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && currentResume) {
      const oldIndex = currentResume.modules.findIndex(m => m.instanceId === String(active.id))
      const newIndex = currentResume.modules.findIndex(m => m.instanceId === String(over.id))
      const newModules = arrayMove(currentResume.modules, oldIndex, newIndex)
      reorderModules(newModules.map(m => m.instanceId))
      setIsDirty(true)
    }
  }

  const handleAddModule = (moduleId: string) => {
    const instanceId = `${moduleId}-${Date.now()}`
    const config = moduleConfigs.find(c => c.id === moduleId)
    // 列表类型模块初始化为 { items: [] }，单体模块初始化为 {}
    const initialData = config?.allowMultiple ? { items: [] } : {}
    addModule(moduleId, instanceId, initialData)
    setSelectedModuleId(instanceId) // 添加模块后自动选中
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
        // 如果删除的是当前选中的模块，清除选中状态
        if (selectedModuleId === instanceId) {
          setSelectedModuleId(null)
        }
      },
    })
  }

  // 稳定的模块数据更新回调
  const handleModuleDataChange = useCallback((instanceId: string, data: Record<string, unknown> | { items: unknown[] }) => {
    const updateModuleData = useResumeStore.getState().updateModuleData
    updateModuleData(instanceId, data)
    setIsDirty(true)
  }, [])

  const handleSave = async (): Promise<string | null> => {
    if (!currentResume) return null

    // 校验简历名称
    const trimmedTitle = resumeTitle.trim()
    if (!trimmedTitle) {
      setTitleError('请输入简历名称')
      toast.error('请输入简历名称')
      return null
    }
    setTitleError('')

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      if (!authToken) {
        toast.error('请先登录')
        router.push('/login')
        return null
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
        
        // 处理账号被禁用
        if (error.code === 'ACCOUNT_BANNED') {
          const { clearAuth } = useAuthStore.getState()
          clearAuth()
          modal.error({
            title: '账号已被禁用',
            content: error.error || '您的账号已被禁用，无法使用此功能。',
            onOk: () => {
              router.push('/login')
            }
          })
          return null
        }
        
        // 处理订阅相关错误
        if (error.code === 'SUBSCRIPTION_REQUIRED' || error.code === 'SUBSCRIPTION_EXPIRED') {
          const title = error.code === 'SUBSCRIPTION_REQUIRED' ? '需要激活订阅' : '订阅已过期'
          modal.error({
            title,
            content: (
              <div>
                <p>{error.error}</p>
                <p className="mt-2 text-sm text-gray-500">
                  {error.code === 'SUBSCRIPTION_REQUIRED' 
                    ? '请使用激活码激活订阅后使用完整功能。'
                    : '您可以导出PDF保存简历，或删除不需要的简历，或使用激活码续费。'
                  }
                </p>
              </div>
            ),
            okText: '知道了'
          })
          return null
        }
        
        throw new Error(error.error || '保存失败')
      }

      const savedResume = await response.json()
      setCurrentResume(currentResume, savedResume.id, savedResume.title)
      setIsDirty(false) // 保存成功后重置脏状态
      toast.success('保存成功')
      
      if (!resumeId || resumeId === 'new') {
        router.replace(`/resume/${savedResume.id}`)
      }

      return savedResume.id
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败，请稍后重试'
      toast.error(errorMessage)
      return null
    }
  }

  const handleDownload = async () => {
    // 如果没有保存的简历ID，先提示保存
    if (!currentResumeId) {
      modal.confirm({
        title: '提示',
        content: '简历尚未保存，请先保存后再下载。是否现在保存？',
        okText: '保存并下载',
        cancelText: '取消',
        onOk: async () => {
          const savedResumeId = await handleSave()
          // 保存成功后自动下载
          if (savedResumeId) {
            await downloadResume(savedResumeId)
          }
        },
      })
      return
    }

    await downloadResume(currentResumeId)
  }

  const downloadResume = async (resumeIdToDownload: string) => {
    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      if (!authToken) {
        toast.error('请先登录')
        router.push('/login')
        return
      }

      setIsDownloading(true)

      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ resumeId: resumeIdToDownload }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '导出失败')
      }

      // 从响应头获取文件名，如果没有则使用默认名称
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `${resumeTitle || 'resume'}.pdf`
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '简历下载失败'
      toast.error(errorMessage)
    } finally {
      setIsDownloading(false)
    }
  }

  // 在加载时显示骨架屏
  if (loading) {
    return <ResumeEditorSkeleton />
  }

  return (
    <div className="h-screen bg-black overflow-auto" suppressHydrationWarning>
      {/* Header - 标题和保存按钮 */}
      <div className="max-w-[1200px] mx-auto my-6 flex justify-between items-center">
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
          <Button 
            type="default"
            title="下载简历"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            disabled={!currentResume}
            loading={isDownloading}
          />
        </div>
      </div>

      {/* 整体容器，左侧留出 40px 边距，上边距 100px */}
      <div className="flex max-w-[1200px] mx-auto" style={{ height: 'calc(100vh - 150px)' }}>
        {/* 左栏：简历名称和模块列表 */}
        <div className="w-[250px] flex flex-col h-full pt-4 pb-4 pl-2 pr-2 bg-[#27272A] rounded-l-[4px]">
          {/* 简历名称 */}
          <div className="mb-6 flex-shrink-0 px-2">
            <label htmlFor="resume-title" className="text-xs font-medium text-white mb-2 block">
              简历名称
            </label>
            <Input
              id="resume-title"
              value={resumeTitle}
              onChange={handleTitleChange}
              placeholder="Email"
              allowClear
              className="w-full"
              status={titleError ? 'error' : ''}
              style={{ background: '#09090B', borderColor: titleError ? '#ff4d4f' : '#27272A', color: 'white', fontSize: '14px' }}
            />
            {titleError && (
              <div className="text-xs text-red-500 mt-1">{titleError}</div>
            )}
          </div>

          {/* 简历模块 */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-shrink-0 px-2 mb-2">
              <h2 className="text-xs font-medium text-white mb-2">简历模块</h2>
              
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => setIsModuleDialogOpen(true)}
                block
                className="mb-2 !h-10"
                style={{ background: '#09090B', borderColor: '#27272A', color: 'white' }}
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-outside px-2">
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
                      selectedModuleId={selectedModuleId}
                      onSelect={setSelectedModuleId}
                    />
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-xs text-[#A1A1AA]">
                  暂无模块
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

        {/* 中栏：模块编辑表单 */}
        <div className="w-[340px] flex flex-col h-full pt-4 pb-4 border-l-1 bg-[#27272A] rounded-r-[4px]">
          {selectedModuleId && currentResume ? (() => {
            const selectedModule = currentResume.modules.find(m => m.instanceId === selectedModuleId)
            if (!selectedModule) return null
            const moduleConfig = moduleConfigs.find(c => c.id === selectedModule.moduleId)
            if (!moduleConfig) return null

            return (
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0 px-2 mb-0">
                  <div className="bg-[#09090B] rounded-t-[4px] px-2 py-2 border-b border-[#27272A]">
                    <h3 className="text-sm font-medium text-[#A1A1AA] leading-6">{moduleConfig.name}</h3>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-outside px-2">
                  <div className="bg-[#09090B] rounded-b-[4px] px-2 py-4">
                    {moduleConfig.allowMultiple ? (
                      <DynamicListForm
                        key={selectedModuleId}
                        moduleConfig={moduleConfig}
                        initialData={selectedModule.data}
                        onChange={(data) => handleModuleDataChange(selectedModuleId, data)}
                      />
                    ) : (
                      <DynamicForm
                        key={selectedModuleId}
                        moduleConfig={moduleConfig}
                        initialData={selectedModule.data}
                        onChange={(data) => handleModuleDataChange(selectedModuleId, data)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="flex items-center justify-center h-full text-sm text-[#A1A1AA]">
              请从左侧选择一个模块进行编辑
            </div>
          )}
        </div>

        {/* 右栏：预览区 */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-outside bg-black rounded ml-4">
          <ResumePreview />
        </div>
      </div>
    </div>
  )
}
