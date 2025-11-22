'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Collapse } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { GripVertical } from 'lucide-react'
import { DynamicForm } from '@/components/forms/dynamic-form'
import { DynamicListForm } from '@/components/forms/dynamic-list-form'
import { getModuleConfig } from '@/lib/modules'
import { ResumeModuleData } from '@/types/resume'
import { useResumeStore } from '@/lib/store'

interface ResumeModuleAccordionItemProps {
  module: ResumeModuleData
  onRemove: () => void
}

function SortableModuleAccordionItem({ module, onRemove }: ResumeModuleAccordionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: module.instanceId,
  })
  const moduleConfig = getModuleConfig(module.moduleId)
  const updateModuleData = useResumeStore((state) => state.updateModuleData)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleFormChange = (data: Record<string, unknown> | { items: unknown[] }) => {
    updateModuleData(module.instanceId, data)
  }

  if (!moduleConfig) return null

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Collapse
        items={[{
          key: module.instanceId,
          label: (
            <div className="flex items-center gap-2 flex-1">
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
              <span className="font-medium text-sm text-[#A1A1AA] leading-6">
                {moduleConfig.name}
              </span>
            </div>
          ),
          extra: (
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
          ),
          children: (
            <div>
              {moduleConfig.allowMultiple ? (
                <DynamicListForm
                  moduleConfig={moduleConfig}
                  initialData={module.data}
                  onChange={handleFormChange}
                />
              ) : (
                <DynamicForm
                  moduleConfig={moduleConfig}
                  initialData={module.data}
                  onChange={handleFormChange}
                />
              )}
            </div>
          ),
        }]}
        className="border border-[#27272A] bg-[#09090B] rounded"
        style={{ background: '#09090B', borderColor: '#27272A' }}
        expandIcon={() => null}
      />
    </div>
  )
}

interface ResumeModuleAccordionProps {
  modules: ResumeModuleData[]
  onRemove: (instanceId: string) => void
  defaultOpenItems?: string[]
}

export function ResumeModuleAccordion({
  modules,
  onRemove,
  defaultOpenItems = [],
}: ResumeModuleAccordionProps) {
  return (
    <div className="w-full space-y-0">
      {modules.map((module) => (
        <SortableModuleAccordionItem
          key={module.instanceId}
          module={module}
          onRemove={() => onRemove(module.instanceId)}
        />
      ))}
    </div>
  )
}
