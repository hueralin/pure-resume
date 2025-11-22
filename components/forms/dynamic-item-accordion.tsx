'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Collapse, Input, Select, DatePicker, Form } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { GripVertical } from 'lucide-react'
import { Control, useWatch, FieldValues, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { ModuleConfig, ModuleField } from '@/lib/modules'

interface DynamicItemAccordionProps {
  id: string
  index: number
  control: Control<FieldValues>
  moduleConfig: ModuleConfig
  canRemove: boolean
  onRemove: () => void
}

export function DynamicItemAccordion({
  id,
  index,
  control,
  moduleConfig,
  canRemove,
  onRemove,
}: DynamicItemAccordionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 监听当前项的所有字段值，用于动态更新标题
  const itemValues = useWatch({
    control,
    name: `items.${index}`,
  })

  // 动态生成标题
  // 策略：取前两个非 textarea/date 类型的字段作为标题
  const getTitle = () => {
    const titleFields = moduleConfig.fields.filter(f => 
      f.type === 'text' || f.type === 'select'
    ).slice(0, 2)

    if (titleFields.length === 0) return `${moduleConfig.name} ${index + 1}`

    const values = titleFields.map(field => itemValues?.[field.id]).filter(Boolean)
    
    if (values.length > 0) {
      return values.join(' - ')
    }
    
    return `${moduleConfig.name} ${index + 1}`
  }

  const renderField = (field: ModuleField) => {
    return (
      <Controller
        key={field.id}
        control={control}
        name={`items.${index}.${field.id}`}
        render={({ field: formField, fieldState }) => (
          <Form.Item
            label={<span className="text-xs font-medium text-white">{field.label}</span>}
            validateStatus={fieldState.error ? 'error' : ''}
            help={fieldState.error?.message}
          >
            {field.type === 'textarea' ? (
              <Input.TextArea 
                placeholder={field.placeholder} 
                {...formField}
                rows={3}
                allowClear
                className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA]"
                style={{ resize: 'none' }}
              />
            ) : field.type === 'select' ? (
              <Select
                value={formField.value || undefined}
                onChange={formField.onChange}
                placeholder={field.placeholder || '请选择'}
                allowClear
                className="w-full"
                popupClassName="bg-[#09090B]"
              >
                {field.options?.map((option) => (
                  <Select.Option key={option} value={option}>
                    {option}
                  </Select.Option>
                ))}
              </Select>
            ) : field.type === 'date' ? (
              <DatePicker
                value={formField.value ? dayjs(formField.value) : undefined}
                onChange={(date) => {
                  formField.onChange(date ? date.format('YYYY-MM-DD') : '')
                }}
                placeholder={field.placeholder || '选择日期'}
                allowClear
                className="w-full"
                format="YYYY-MM-DD"
              />
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                {...formField}
                allowClear
                className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA]"
              />
            )}
          </Form.Item>
        )}
      />
    )
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Collapse
        items={[{
          key: `item-${index}`,
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
              <span className="text-xs font-medium text-[#A1A1AA] flex-1 text-left">
                {getTitle()}
              </span>
            </div>
          ),
          extra: canRemove ? (
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
          ) : null,
          children: (
            <Form layout="vertical" className="pt-4">
              {moduleConfig.fields.map(renderField)}
            </Form>
          ),
        }]}
        className="border border-[#27272A] rounded bg-[#09090B]"
        style={{ background: '#09090B', borderColor: '#27272A' }}
      />
    </div>
  )
}

