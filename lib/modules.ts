import basicInfoConfig from '@/config/modules/basic-info.json'
import educationConfig from '@/config/modules/education.json'
import workExperienceConfig from '@/config/modules/work-experience.json'

export interface ModuleField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'select' | 'multi-select' | 'rich-text'
  required?: boolean
  placeholder?: string
  options?: string[] // for select/multi-select
}

export interface ModuleConfig {
  id: string
  name: string
  icon: string
  allowMultiple: boolean // 模块内部是否可以添加多个子项（如教育经历模块可以添加多个教育经历项）
  unique?: boolean // 模块是否可以重复添加（默认 true，即只能添加一次）
  order: number
  fields: ModuleField[]
}

// 加载所有模块配置
export function loadModuleConfigs(): ModuleConfig[] {
  return [
    basicInfoConfig as ModuleConfig,
    educationConfig as ModuleConfig,
    workExperienceConfig as ModuleConfig,
  ].sort((a, b) => a.order - b.order)
}

export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return loadModuleConfigs().find(m => m.id === moduleId)
}
