'use client'

import { ResumeData } from '@/types/resume'
import { getModuleConfig } from '@/lib/modules'

interface DefaultTemplateProps {
  data: ResumeData
}

export function DefaultTemplate({ data }: DefaultTemplateProps) {
  return (
    <div className="p-8 space-y-6" style={{ color: '#1a1a1a' }}>
      {data.modules.map((module) => {
        const config = getModuleConfig(module.moduleId)
        if (!config) return null

        return (
          <div key={module.instanceId} className="space-y-2">
            <h2 
              className="text-2xl font-bold border-b-2 pb-2"
              style={{ 
                color: '#1a1a1a',
                borderColor: '#3b82f6'
              }}
            >
              {config.name}
            </h2>
            <div className="space-y-3 mt-4">
              {config.fields.map((field) => {
                const value = module.data[field.id]
                if (!value) return null

                return (
                  <div key={field.id} style={{ color: '#1a1a1a' }}>
                    <span className="font-semibold" style={{ color: '#1a1a1a' }}>{field.label}:</span>{' '}
                    <span style={{ color: '#1a1a1a' }}>{value}</span>
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

