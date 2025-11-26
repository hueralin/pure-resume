'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Collapse, Input, Select, DatePicker, Form } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { GripVertical } from 'lucide-react'
import { Control, useWatch, FieldValues, Controller } from 'react-hook-form'
import dayjs from 'dayjs'

interface EducationItemAccordionProps {
  id: string
  index: number
  control: Control<FieldValues>
  canRemove: boolean
  onRemove: () => void
}

export function EducationItemAccordion({
  id,
  index,
  control,
  canRemove,
  onRemove,
}: EducationItemAccordionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 监听表单值变化以更新标题
  const item = useWatch({
    control,
    name: `items.${index}`,
  })

  // 获取标题显示文本
  const getTitle = () => {
    const school = item?.school
    const major = item?.major
    const degree = item?.degree
    
    if (school && major) {
      return `${school} - ${major}${degree ? ` (${degree})` : ''}`
    }
    if (school) {
      return school
    }
    return `教育经历 ${index + 1}`
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
              <Controller
                control={control}
                name={`items.${index}.school`}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label={<span className="text-xs font-medium text-white">学校名称</span>}
                    validateStatus={fieldState.error ? 'error' : ''}
                    help={fieldState.error?.message}
                  >
                    <Input
                      placeholder="请输入学校名称"
                      {...field}
                      allowClear
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA]"
                    />
                  </Form.Item>
                )}
              />

              <Controller
                control={control}
                name={`items.${index}.major`}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label={<span className="text-xs font-medium text-white">专业</span>}
                    validateStatus={fieldState.error ? 'error' : ''}
                    help={fieldState.error?.message}
                  >
                    <Input
                      placeholder="请输入专业名称"
                      {...field}
                      allowClear
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA]"
                    />
                  </Form.Item>
                )}
              />

              <Controller
                control={control}
                name={`items.${index}.degree`}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label={<span className="text-xs font-medium text-white">学历</span>}
                    validateStatus={fieldState.error ? 'error' : ''}
                    help={fieldState.error?.message}
                  >
                    <Select
                      value={field.value || undefined}
                      onChange={field.onChange}
                      placeholder="请选择学历"
                      allowClear
                      className="w-full"
                    >
                      {['专科', '本科', '硕士', '博士', '其他'].map((option) => (
                        <Select.Option key={option} value={option}>
                          {option}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              />

              <Controller
                control={control}
                name={`items.${index}.startDate`}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label={<span className="text-xs font-medium text-white">开始时间</span>}
                    validateStatus={fieldState.error ? 'error' : ''}
                    help={fieldState.error?.message}
                  >
                    <DatePicker
                      value={field.value ? dayjs(field.value) : undefined}
                      onChange={(date) => {
                        field.onChange(date ? date.format('YYYY-MM-DD') : '')
                      }}
                      placeholder="选择开始时间"
                      allowClear
                      className="w-full"
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                )}
              />

              <Controller
                control={control}
                name={`items.${index}.endDate`}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label={<span className="text-xs font-medium text-white">结束时间</span>}
                    validateStatus={fieldState.error ? 'error' : ''}
                    help={fieldState.error?.message}
                  >
                    <DatePicker
                      value={field.value ? dayjs(field.value) : undefined}
                      onChange={(date) => {
                        field.onChange(date ? date.format('YYYY-MM-DD') : '')
                      }}
                      placeholder="选择结束时间（如在校可留空）"
                      allowClear
                      className="w-full"
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                )}
              />

              <Controller
                control={control}
                name={`items.${index}.description`}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label={<span className="text-xs font-medium text-white">描述</span>}
                    validateStatus={fieldState.error ? 'error' : ''}
                    help={fieldState.error?.message}
                  >
                    <Input.TextArea
                      placeholder="可填写主要课程、成绩、荣誉等（选填）"
                      {...field}
                      rows={6}
                      allowClear
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA]"
                      style={{ resize: 'vertical' }}
                    />
                  </Form.Item>
                )}
              />
            </Form>
          ),
        }]}
        className="border border-[#27272A] rounded bg-[#09090B]"
        style={{ background: '#09090B', borderColor: '#27272A' }}
        expandIcon={() => null}
      />
    </div>
  )
}

