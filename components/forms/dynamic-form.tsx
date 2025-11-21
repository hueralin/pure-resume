'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: moduleConfig.fields.reduce((acc, field) => {
      // 确保每个字段都有默认值，避免 uncontrolled -> controlled 错误
      acc[field.id] = initialData?.[field.id] ?? ''
      return acc
    }, {} as Record<string, any>),
  })

  const { watch } = form
  const formData = watch()

  // 防抖更新
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(formData)
    }, 300)

    return () => clearTimeout(timer)
  }, [formData, onChange])

  return (
    <Form {...form}>
      <div className="space-y-2.5">
        <h3 className="text-sm font-semibold">{moduleConfig.name}</h3>
        {moduleConfig.fields.map((field) => (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  {field.type === 'textarea' ? (
                    <Textarea 
                      placeholder={field.placeholder} 
                      {...formField} 
                    />
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      {...formField}
                    />
                  )}
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        ))}
      </div>
    </Form>
  )
}

