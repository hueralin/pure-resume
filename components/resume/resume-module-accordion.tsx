'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CloseOutlined } from '@ant-design/icons'
import { GripVertical } from 'lucide-react'
import { getModuleConfig } from '@/lib/modules'
import { ResumeModuleData } from '@/types/resume'

interface ResumeModuleAccordionItemProps {
  module: ResumeModuleData
  onRemove: () => void
  isSelected: boolean
  onSelect: () => void
}

function SortableModuleAccordionItem({ module, onRemove, isSelected, onSelect }: ResumeModuleAccordionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: module.instanceId,
  })
  const moduleConfig = getModuleConfig(module.moduleId)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!moduleConfig) return null

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div
        className={`border rounded cursor-pointer transition-colors ${
          isSelected 
            ? 'border-[#27272A] bg-[#09090B]' 
            : 'border-[#000000] bg-[#09090B] hover:border-[#27272A]'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-[#A1A1AA] hover:text-white"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className={`font-medium text-sm leading-6 flex-1 ${
            isSelected ? 'text-white' : 'text-[#A1A1AA]'
          }`}>
            {moduleConfig.name}
          </span>
          <div
            className="h-3 w-3 hover:opacity-70 cursor-pointer flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            role="button"
            tabIndex={0}
          >
            <CloseOutlined className="h-3 w-3 text-[#A1A1AA]" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface ResumeModuleAccordionProps {
  modules: ResumeModuleData[]
  onRemove: (instanceId: string) => void
  selectedModuleId?: string | null
  onSelect?: (instanceId: string) => void
  defaultOpenItems?: string[]
}

export function ResumeModuleAccordion({
  modules,
  onRemove,
  selectedModuleId,
  onSelect,
  defaultOpenItems = [],
}: ResumeModuleAccordionProps) {
  return (
    <div className="w-full space-y-0">
      {modules.map((module) => (
        <SortableModuleAccordionItem
          key={module.instanceId}
          module={module}
          onRemove={() => onRemove(module.instanceId)}
          isSelected={selectedModuleId === module.instanceId}
          onSelect={() => onSelect?.(module.instanceId)}
        />
      ))}
    </div>
  )
}
