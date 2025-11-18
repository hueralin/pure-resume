'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
      
      if (field.required) {
        acc[field.id] = fieldSchema.min(1, `${field.label}不能为空`)
      } else {
        acc[field.id] = fieldSchema.optional()
      }
      
      return acc
    }, {} as Record<string, z.ZodTypeAny>)
  )

  type FormData = z.infer<typeof schema>

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {},
  })

  const formData = watch()

  // 防抖更新
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(formData)
    }, 300)

    return () => clearTimeout(timer)
  }, [formData, onChange])

  const renderField = (field: ModuleField) => {
    const commonProps = {
      id: field.id,
      placeholder: field.placeholder,
      ...register(field.id),
    }

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea {...commonProps} />
            {errors[field.id] && (
              <p className="text-sm text-destructive">
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        )
      case 'email':
      case 'tel':
      case 'text':
      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type={field.type}
              {...commonProps}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{moduleConfig.name}</h3>
      {moduleConfig.fields.map(renderField)}
    </div>
  )
}

