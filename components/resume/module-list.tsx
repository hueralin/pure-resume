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
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="font-medium">{moduleConfig?.name || moduleId}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
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
      if (config.allowMultiple) return true
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">可用模块</h2>
        <div className="space-y-2">
          {moduleConfigs.map(config => (
            <Card key={config.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{config.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddModule(config.id)}
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-4">已添加模块</h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentResume.modules.map(m => m.instanceId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
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
        <h2 className="text-xl font-semibold mb-4">可用模块</h2>
        <div className="space-y-2">
          {availableModules.map(config => (
            <Card key={config.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{config.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddModule(config.id)}
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

