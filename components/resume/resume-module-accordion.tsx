'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { GripVertical, X, ChevronDown } from 'lucide-react'
import { DynamicForm } from '@/components/forms/dynamic-form'
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

  const handleFormChange = (data: Record<string, any>) => {
    updateModuleData(module.instanceId, data)
  }

  if (!moduleConfig) return null

  return (
    <div ref={setNodeRef} style={style} className="mb-0">
      <AccordionItem
        value={module.instanceId}
        className="border border-[#27272A] bg-[#09090B] rounded mb-0"
      >
        <AccordionTrigger className="hover:no-underline py-2 px-3 h-10 bg-[#09090B] rounded-t data-[state=open]:rounded-none [&>svg]:hidden group">
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
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 hover:opacity-70 cursor-pointer flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              role="button"
              tabIndex={0}
            >
              <X className="h-4 w-4 text-[#A1A1AA]" />
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-[#A1A1AA] transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-4 pt-0 bg-[#09090B] border-t border-[#27272A] rounded-b">
          <DynamicForm
            moduleConfig={moduleConfig}
            initialData={module.data}
            onChange={handleFormChange}
          />
        </AccordionContent>
      </AccordionItem>
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
    <Accordion
      type="multiple"
      defaultValue={defaultOpenItems}
      className="w-full space-y-0"
    >
      <div className="space-y-0">
        {modules.map((module) => (
          <SortableModuleAccordionItem
            key={module.instanceId}
            module={module}
            onRemove={() => onRemove(module.instanceId)}
          />
        ))}
      </div>
    </Accordion>
  )
}

