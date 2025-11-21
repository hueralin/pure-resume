'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[423px] bg-[#09090B] border border-[#27272A] shadow-lg p-6">
        <AlertDialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <AlertDialogTitle className="text-lg font-semibold text-white">简历模块</AlertDialogTitle>
            <button
              onClick={handleCancel}
              className="h-4 w-4 opacity-70 hover:opacity-100"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <AlertDialogDescription className="text-sm text-[#A1A1AA] pt-1.5">
            请选择要添加的简历模块
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 pb-6">
          {modules.map((module) => {
            const isSelected = selectedModuleId === module.id
            return (
              <div
                key={module.id}
                onClick={() => setSelectedModuleId(module.id)}
                className={cn(
                  'relative p-4 rounded border cursor-pointer transition-colors',
                  'hover:bg-[#27272A]/50',
                  isSelected
                    ? 'border-[#27272A] bg-[#27272A]/30'
                    : 'border-[#27272A] bg-[#09090B]'
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
        <AlertDialogFooter className="flex-row justify-end gap-2 pt-0">
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!selectedModuleId}
            className="h-10 px-4 bg-white text-[#18181B] hover:bg-white/90 rounded-md font-medium"
          >
            确定
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

