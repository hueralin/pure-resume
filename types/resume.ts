export interface ResumeModuleData {
  moduleId: string
  instanceId: string
  data: Record<string, any>
}

export interface ResumeData {
  modules: ResumeModuleData[]
}

