export interface ResumeModuleData {
  moduleId: string
  instanceId: string
  data: Record<string, any>
}

export interface ResumeGlobalSettings {
  themeColor?: string
}

export interface ResumeData {
  globalSettings?: ResumeGlobalSettings
  modules: ResumeModuleData[]
}
