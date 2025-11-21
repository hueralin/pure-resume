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

        // 教育经历模块特殊处理：显示多个教育经历项
        if (module.moduleId === 'education' && module.data.items && Array.isArray(module.data.items)) {
          return (
            <div key={module.instanceId} className="space-y-2">
              <h2 
                className="text-2xl font-bold border-b-2 pb-2 text-foreground border-primary"
              >
                {config.name}
              </h2>
              <div className="space-y-6 mt-4">
                {module.data.items.map((item: any, index: number) => (
                  <div key={index} className="space-y-3">
                    {item.school && (
                      <div className="text-foreground">
                        <span className="font-semibold text-foreground">学校名称:</span>{' '}
                        <span className="text-foreground">{item.school}</span>
                      </div>
                    )}
                    {item.major && (
                      <div className="text-foreground">
                        <span className="font-semibold text-foreground">专业:</span>{' '}
                        <span className="text-foreground">{item.major}</span>
                      </div>
                    )}
                    {item.degree && (
                      <div className="text-foreground">
                        <span className="font-semibold text-foreground">学历:</span>{' '}
                        <span className="text-foreground">{item.degree}</span>
                      </div>
                    )}
                    {item.startDate && (
                      <div className="text-foreground">
                        <span className="font-semibold text-foreground">时间:</span>{' '}
                        <span className="text-foreground">
                          {item.endDate ? `${item.startDate} - ${item.endDate}` : `${item.startDate} - 至今`}
                        </span>
                      </div>
                    )}
                    {item.description && (
                      <div className="text-foreground">
                        <span className="font-semibold text-foreground">描述:</span>{' '}
                        <span className="text-foreground">{item.description}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        }

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

