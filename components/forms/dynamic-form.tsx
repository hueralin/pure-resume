'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select, DatePicker, Form } from 'antd'
import dayjs from 'dayjs'
import { ModuleConfig, ModuleField } from '@/lib/modules'
import { useEffect } from 'react'

interface DynamicFormProps {
  moduleConfig: ModuleConfig
  initialData?: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

export function DynamicForm({ moduleConfig, initialData, onChange }: DynamicFormProps) {
  // 生成 Zod schema
  const schema = z.object(
    moduleConfig.fields.reduce((acc, field) => {
      let fieldSchema: z.ZodTypeAny = z.string()
      
      if (field.type === 'email') {
        fieldSchema = z.string().email('邮箱格式不正确')
      } else if (field.type === 'tel') {
        fieldSchema = z.string().regex(/^[\d\s\-+()]+$/, '电话号码格式不正确')
      }
      
      // 所有字段都是可选的（除了简历名称，但简历名称不在模块配置中）
      acc[field.id] = fieldSchema.optional()
      
      return acc
    }, {} as Record<string, z.ZodTypeAny>)
  )

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: moduleConfig.fields.reduce((acc, field) => {
      // 确保每个字段都有默认值，避免 uncontrolled -> controlled 错误
      acc[field.id] = initialData?.[field.id] ?? ''
      return acc
    }, {} as Record<string, any>),
  })

  // 当 initialData 变化时，更新表单值
  useEffect(() => {
    const newValues = moduleConfig.fields.reduce((acc, field) => {
      acc[field.id] = initialData?.[field.id] ?? ''
      return acc
    }, {} as Record<string, any>)
    form.reset(newValues)
  }, [initialData, moduleConfig.fields, form])

  const { watch } = form
  const formData = watch()

  // 防抖更新
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(formData)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  return (
    <Form layout="vertical" className="pt-2">
      {moduleConfig.fields.map((field) => (
        <Controller
          key={field.id}
          control={form.control}
          name={field.id}
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
      ))}
    </Form>
  )
}

