import basicInfoConfig from '@/config/modules/basic-info.json'

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
  allowMultiple: boolean
  order: number
  fields: ModuleField[]
}

// 加载所有模块配置
export function loadModuleConfigs(): ModuleConfig[] {
  return [basicInfoConfig as ModuleConfig]
}

export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return loadModuleConfigs().find(m => m.id === moduleId)
}

