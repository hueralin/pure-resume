'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { Button, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ModuleConfig } from '@/lib/modules'
import { EducationItemAccordion } from './education-item-accordion'

interface EducationItem {
  school?: string
  major?: string
  degree?: string
  startDate?: string
  endDate?: string
  description?: string
  _id?: string // 内部使用的唯一标识符
}

interface EducationFormProps {
  moduleConfig: ModuleConfig
  initialData?: { items?: EducationItem[] } | Record<string, unknown>
  onChange: (data: { items: EducationItem[] }) => void
}

export function EducationForm({ moduleConfig, initialData, onChange }: EducationFormProps) {
  const { modal } = App.useApp()
  const getInitialItems = (): EducationItem[] => {
    if (initialData && 'items' in initialData && Array.isArray(initialData.items) && initialData.items.length > 0) {
      // 确保每个 item 都有 _id
      return initialData.items.map((item, index) => ({
        ...item,
        _id: item._id || `item-${Date.now()}-${index}`,
      }))
    }
    return [{
      school: '',
      major: '',
      degree: '',
      startDate: '',
      endDate: '',
      description: '',
      _id: `item-${Date.now()}-0`,
    }]
  }

  const [items, setItems] = useState<EducationItem[]>(getInitialItems)
  const isDraggingRef = useRef(false)
  const isAddingRef = useRef(false)
  const isRemovingRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 生成单个教育经历的 Zod schema（所有字段都是可选的）
  const itemSchema = z.object({
    school: z.string().optional(),
    major: z.string().optional(),
    degree: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })

  const formSchema = z.object({
    items: z.array(itemSchema),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items,
    },
  })

  const { watch } = form
  const formData = watch()

  // 当 items 变化时更新表单
  // 注意：拖拽、添加和删除时跳过 reset，因为已经通过 setValue 更新了
  useEffect(() => {
    if (!isDraggingRef.current && !isAddingRef.current && !isRemovingRef.current) {
      // 移除 _id 字段后再重置表单（_id 是内部使用的，不应该保存到表单数据中）
      const itemsWithoutId = items.map(({ _id, ...item }) => item)
      form.reset({ items: itemsWithoutId }, { keepValues: false })
    }
    // 重置标志
    if (isAddingRef.current) {
      isAddingRef.current = false
    }
    if (isRemovingRef.current) {
      isRemovingRef.current = false
    }
  }, [items, form])

  // 防抖更新（移除 _id 字段）
  useEffect(() => {
    const timer = setTimeout(() => {
      const itemsWithoutId = (formData.items || []).map((item: EducationItem) => {
        const { _id, ...rest } = item
        return rest
      })
      onChange({ items: itemsWithoutId })
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  const handleAddItem = () => {
    // 获取当前表单值，确保保留已有数据
    const currentFormItems = form.getValues('items') || []
    const newItem: EducationItem = {
      school: '',
      major: '',
      degree: '',
      startDate: '',
      endDate: '',
      description: '',
      _id: `item-${Date.now()}-${items.length}`,
    }
    // 设置添加标志，防止 useEffect 中的 reset 清空数据
    isAddingRef.current = true
    // 先更新表单值，保留已有数据
    form.setValue('items', [...currentFormItems, {
      school: '',
      major: '',
      degree: '',
      startDate: '',
      endDate: '',
      description: '',
    }])
    // 然后更新 items 状态
    const newItems = [...items, newItem]
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条教育经历吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        // 获取当前表单值
        const currentFormItems = form.getValues('items') || []
        // 移除对应索引的表单数据
        const newFormItems = currentFormItems.filter((_, i) => i !== index)
        const newItems = items.filter((_, i) => i !== index)
        // 设置删除标志，防止 useEffect 中的 reset 清空数据
        isRemovingRef.current = true
        // 先更新表单值，保留剩余数据
        form.setValue('items', newFormItems)
        // 然后更新 items 状态
        setItems(newItems)
      },
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // 通过 _id 查找索引
    const oldIndex = items.findIndex(item => item._id === active.id)
    const newIndex = items.findIndex(item => item._id === over.id)
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    isDraggingRef.current = true
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)
    // 直接更新表单值，避免触发 form.reset
    form.setValue('items', newItems, { shouldDirty: false })
    // 重置标志
    setTimeout(() => {
      isDraggingRef.current = false
    }, 0)
  }

  // 生成拖拽项的 ID 列表（使用 _id）
  const itemIds = useMemo(() => items.map(item => item._id || `item-${items.indexOf(item)}`), [items])

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, index) => (
              <EducationItemAccordion
                key={item._id || `item-${index}`}
                id={item._id || `item-${index}`}
                index={index}
                control={form.control}
                canRemove={true}
                onRemove={() => handleRemoveItem(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="default"
        icon={<PlusOutlined />}
        onClick={handleAddItem}
        block
        className="mt-2"
        style={{ background: '#09090B', borderColor: '#27272A', color: 'white' }}
      >
        添加一项
      </Button>
    </div>
  )
}

