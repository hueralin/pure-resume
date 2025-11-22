'use client'

import { useState } from 'react'
import { Modal } from 'antd'
import { ModuleConfig } from '@/lib/modules'
import { cn } from '@/lib/utils'

interface ModuleSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modules: ModuleConfig[]
  onSelect: (moduleId: string) => void
}

export function ModuleSelectDialog({
  open,
  onOpenChange,
  modules,
  onSelect,
}: ModuleSelectDialogProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')

  const handleConfirm = () => {
    if (selectedModuleId) {
      onSelect(selectedModuleId)
      setSelectedModuleId('')
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setSelectedModuleId('')
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="添加模块"
      onOk={handleConfirm}
      okText="确定"
      cancelText="取消"
      okButtonProps={{ disabled: !selectedModuleId }}
    >
      <div className="mb-4 text-gray-500">
        请选择要添加的简历模块
      </div>
      <div className="space-y-2">
        {modules.map((module) => {
          const isSelected = selectedModuleId === module.id
          return (
            <div
              key={module.id}
              onClick={() => setSelectedModuleId(module.id)}
              className={cn(
                'relative p-4 rounded border cursor-pointer transition-colors',
                'bg-[#27272A] hover:bg-[#09090B]',
                isSelected
                  ? 'border-[#27272A] bg-[#09090B]'
                  : 'border-[#27272A]'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-white mb-1">
                    {module.name}
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    添加此模块到您的简历
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className="h-4 w-4 rounded-full bg-white border-2 border-white flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-[#09090B]" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-[#A1A1AA]" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

