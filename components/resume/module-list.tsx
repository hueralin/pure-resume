'use client'

import { useMemo } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { loadModuleConfigs } from '@/lib/modules'
import { useResumeStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, X } from 'lucide-react'

function SortableModuleItem({ instanceId, moduleId, onRemove }: { instanceId: string; moduleId: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: instanceId })
  const moduleConfigs = loadModuleConfigs()
  const moduleConfig = moduleConfigs.find(m => m.id === moduleId)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="p-2.5 bg-card border-border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="font-medium text-sm text-foreground">
            {moduleConfig?.name || moduleId}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-6 w-6 hover:bg-accent text-muted-foreground hover:text-accent-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  )
}

export function ModuleList() {
  const { currentResume, reorderModules, removeModule } = useResumeStore()
  const moduleConfigs = loadModuleConfigs()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const availableModules = useMemo(() => {
    if (!currentResume) return moduleConfigs

    const usedModuleIds = new Set(currentResume.modules.map(m => m.moduleId))
    return moduleConfigs.filter(config => {
      // unique 默认为 true，如果为 false 则允许重复添加
      const isUnique = config.unique !== false
      if (!isUnique) return true
      return !usedModuleIds.has(config.id)
    })
  }, [currentResume, moduleConfigs])

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id && currentResume) {
      const oldIndex = currentResume.modules.findIndex(m => m.instanceId === active.id)
      const newIndex = currentResume.modules.findIndex(m => m.instanceId === over.id)
      const newModules = arrayMove(currentResume.modules, oldIndex, newIndex)
      reorderModules(newModules.map(m => m.instanceId))
    }
  }

  const handleAddModule = (moduleId: string) => {
    const instanceId = `${moduleId}-${Date.now()}`
    useResumeStore.getState().addModule(moduleId, instanceId, {})
  }

  if (!currentResume) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">可用模块</h2>
        <div className="space-y-1.5">
          {moduleConfigs.map(config => (
            <Card 
              key={config.id} 
              className="p-2.5 bg-card border-border"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground">{config.name}</span>
                <Button
                  variant="outline"
                  onClick={() => handleAddModule(config.id)}
                  className="border-border text-primary hover:bg-accent hover:text-accent-foreground text-xs px-2 h-[22px]"
                >
                  添加
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold mb-2 text-foreground">已添加模块</h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentResume.modules.map(m => m.instanceId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {currentResume.modules.map(module => (
                <SortableModuleItem
                  key={module.instanceId}
                  instanceId={module.instanceId}
                  moduleId={module.moduleId}
                  onRemove={() => removeModule(module.instanceId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2 text-foreground">可用模块</h2>
        <div className="space-y-1.5">
          {availableModules.map(config => (
            <Card 
              key={config.id} 
              className="p-2.5 bg-card border-border"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground">{config.name}</span>
                <Button
                  variant="outline"
                  onClick={() => handleAddModule(config.id)}
                  className="border-border text-primary hover:bg-accent hover:text-accent-foreground text-xs px-2 h-[22px]"
                >
                  添加
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

