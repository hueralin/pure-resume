'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { X, GripVertical } from 'lucide-react'
import { Control, useWatch, FieldValues } from 'react-hook-form'
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

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
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value={`item-${index}`}
          className="border border-[#27272A] rounded bg-[#09090B]"
        >
          <AccordionTrigger className="hover:no-underline py-2 px-3 h-auto bg-[#09090B] rounded-t data-[state=open]:rounded-none group">
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
              <span className="text-xs font-medium text-[#A1A1AA] group-hover:text-white transition-colors flex-1 text-left">
                {getTitle()}
              </span>
              {canRemove && (
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
              )}
            </div>
          </AccordionTrigger>
        <AccordionContent className="px-3 pb-4 pt-0 bg-[#09090B] border-t border-[#27272A] rounded-b">
          <div className="space-y-4 pt-4">
            <FormField
              control={control}
              name={`items.${index}.school`}
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white mb-3 block">
                    学校名称
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入学校名称"
                      {...field}
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA] rounded h-10 px-3 text-sm focus-visible:ring-1 focus-visible:ring-[#27272A] focus-visible:border-[#27272A]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.major`}
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white mb-3 block">
                    专业
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入专业名称"
                      {...field}
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA] rounded h-10 px-3 text-sm focus-visible:ring-1 focus-visible:ring-[#27272A] focus-visible:border-[#27272A]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.degree`}
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white mb-3 block">
                    学历
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA] rounded h-10 px-3 text-sm focus:ring-1 focus:ring-[#27272A] focus:border-[#27272A]">
                        <SelectValue placeholder="请选择学历" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#09090B] border border-[#27272A] text-white">
                        {['专科', '本科', '硕士', '博士', '其他'].map((option) => (
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
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`items.${index}.startDate`}
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white mb-3 block">
                    开始时间
                  </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => {
                          field.onChange(date ? date.toISOString().split('T')[0] : '')
                        }}
                        placeholder="选择开始时间"
                        className="bg-[#09090B] border border-[#27272A] text-white w-full h-10 px-3 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${index}.endDate`}
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-white mb-3 block">
                      结束时间
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => {
                          field.onChange(date ? date.toISOString().split('T')[0] : '')
                        }}
                        placeholder="选择结束时间（如在校可留空）"
                        className="bg-[#09090B] border border-[#27272A] text-white w-full h-10 px-3 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white mb-3 block">
                    描述
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="可填写主要课程、成绩、荣誉等（选填）"
                      {...field}
                      className="bg-[#09090B] border border-[#27272A] text-white placeholder:text-[#A1A1AA] rounded min-h-[40px] h-auto px-3 py-2.5 text-sm focus-visible:ring-1 focus-visible:ring-[#27272A] focus-visible:border-[#27272A] resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </div>
  )
}

