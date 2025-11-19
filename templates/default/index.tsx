'use client'

import { ResumeData } from '@/types/resume'
import { getModuleConfig } from '@/lib/modules'

interface DefaultTemplateProps {
  data: ResumeData
}

export function DefaultTemplate({ data }: DefaultTemplateProps) {
  return (
    <div className="p-8 space-y-6 text-foreground">
      {data.modules.map((module) => {
        const config = getModuleConfig(module.moduleId)
        if (!config) return null

        return (
          <div key={module.instanceId} className="space-y-2">
            <h2 
              className="text-2xl font-bold border-b-2 pb-2 text-foreground border-primary"
            >
              {config.name}
            </h2>
            <div className="space-y-3 mt-4">
              {config.fields.map((field) => {
                const value = module.data[field.id]
                if (!value) return null

                return (
                  <div key={field.id} className="text-foreground">
                    <span className="font-semibold text-foreground">{field.label}:</span>{' '}
                    <span className="text-foreground">{value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

