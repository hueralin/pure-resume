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
import { DynamicItemAccordion } from './dynamic-item-accordion'

interface DynamicListFormProps {
  moduleConfig: ModuleConfig
  initialData?: { items?: any[] } | Record<string, unknown>
  onChange: (data: { items: any[] }) => void
}

export function DynamicListForm({ moduleConfig, initialData, onChange }: DynamicListFormProps) {
  const { modal } = App.useApp()

  // 生成单个项的空数据结构
  const getEmptyItem = (index: number) => {
    const emptyData: Record<string, any> = {
      _id: `item-${Date.now()}-${index}`,
    }
    moduleConfig.fields.forEach(field => {
      emptyData[field.id] = ''
    })
    return emptyData
  }

  const getInitialItems = (): any[] => {
    if (initialData && 'items' in initialData && Array.isArray(initialData.items) && initialData.items.length > 0) {
      // 确保每个 item 都有 _id
      return initialData.items.map((item, index) => ({
        ...item,
        _id: item._id || `item-${Date.now()}-${index}`,
      }))
    }
    return [getEmptyItem(0)]
  }

  const [items, setItems] = useState<any[]>(getInitialItems)
  const isDraggingRef = useRef(false)
  const isAddingRef = useRef(false)
  const isRemovingRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 动态生成单个项的 Zod schema
  const itemSchema = useMemo(() => {
    const schemaShape: Record<string, z.ZodTypeAny> = {}
    
    moduleConfig.fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny = z.string()
      
      if (field.type === 'email') {
        fieldSchema = z.string().email('邮箱格式不正确')
      } else if (field.type === 'tel') {
        fieldSchema = z.string().regex(/^[\d\s\-+()]+$/, '电话号码格式不正确')
      }
      
      // 所有字段都是可选的
      schemaShape[field.id] = fieldSchema.optional()
    })
    
    // 允许额外的字段（如 _id）通过
    return z.object(schemaShape).passthrough()
  }, [moduleConfig])

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
  useEffect(() => {
    if (!isDraggingRef.current && !isAddingRef.current && !isRemovingRef.current) {
      // 移除 _id 字段后再重置表单（但实际上保留 _id 在内部状态也没关系，只要提交时不带就行）
      // 这里为了保险，还是全量重置，Zod schema 使用了 passthrough 允许 _id
      form.reset({ items }, { keepValues: false })
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
      const itemsWithoutId = (formData.items || []).map((item: any) => {
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
    const newItem = getEmptyItem(items.length)
    
    // 设置添加标志
    isAddingRef.current = true
    
    // 先更新表单值
    // 注意：这里需要先把 newItem 的非空字段加上，虽然 getEmptyItem 返回的都是空字符串
    form.setValue('items', [...currentFormItems, newItem])
    
    // 然后更新 items 状态
    setItems(prev => [...prev, newItem])
  }

  const handleRemoveItem = (index: number) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这一项吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const currentFormItems = form.getValues('items') || []
        const newFormItems = currentFormItems.filter((_, i) => i !== index)
        const newItems = items.filter((_, i) => i !== index)
        
        isRemovingRef.current = true
        
        form.setValue('items', newFormItems)
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
    // 直接更新表单值
    form.setValue('items', newItems, { shouldDirty: false })
    
    setTimeout(() => {
      isDraggingRef.current = false
    }, 0)
  }

  // 生成拖拽项的 ID 列表
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
              <DynamicItemAccordion
                key={item._id || `item-${index}`}
                id={item._id || `item-${index}`}
                index={index}
                control={form.control}
                moduleConfig={moduleConfig}
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

