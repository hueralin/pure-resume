'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
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
      <div className="space-y-6 pt-2">
        {moduleConfig.fields.map((field) => (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-white mb-3 block">
                  {field.label}
                </FormLabel>
                <FormControl>
                  {field.type === 'textarea' ? (
                    <Textarea 
                      placeholder={field.placeholder} 
                      {...formField}
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA] rounded min-h-[40px] h-auto px-3 py-2.5 text-sm focus-visible:ring-1 focus-visible:ring-[#27272A] focus-visible:border-[#27272A] resize-none"
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={formField.value || ''}
                      onValueChange={formField.onChange}
                    >
                      <SelectTrigger className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA] rounded h-10 px-3 text-sm focus:ring-1 focus:ring-[#27272A] focus:border-[#27272A]">
                        <SelectValue placeholder={field.placeholder || '请选择'} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#09090B] border border-[#27272A] text-white">
                        {field.options?.map((option) => (
                          <SelectItem 
                            key={option} 
                            value={option}
                            className="focus:bg-[#27272A] focus:text-white"
                          >
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'date' ? (
                    <DatePicker
                      value={formField.value ? new Date(formField.value) : undefined}
                      onChange={(date) => {
                        formField.onChange(date ? date.toISOString().split('T')[0] : '')
                      }}
                      placeholder={field.placeholder || '选择日期'}
                      className="bg-[#09090B] border border-[#27272A] text-white w-full h-10 px-3 text-sm"
                    />
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      {...formField}
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA] rounded h-10 px-3 text-sm focus-visible:ring-1 focus-visible:ring-[#27272A] focus-visible:border-[#27272A]"
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

