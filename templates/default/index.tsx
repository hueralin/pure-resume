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

        // 渲染模块标题
        const renderTitle = () => (
          <h2 className="text-2xl font-bold border-b-2 pb-2 text-foreground border-primary mb-4">
            {config.name}
          </h2>
        )

        // 情况1：列表型模块（教育经历、工作经历等）
        if (config.allowMultiple && module.data.items && Array.isArray(module.data.items)) {
          return (
            <div key={module.instanceId} className="space-y-2">
              {renderTitle()}
              <div className="space-y-6">
                {module.data.items.map((item: any, index: number) => (
                  <div key={index} className="space-y-2">
                    {config.fields.map((field) => {
                      const value = item[field.id]
                      if (!value) return null
                      
                      if (field.type === 'textarea') {
                        return (
                          <div key={field.id} className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                            <span className="font-semibold">{field.label}:</span>
                            <br />
                            {value}
                          </div>
                        )
                      }

                      return (
                        <div key={field.id} className="text-foreground">
                          <span className="font-semibold text-foreground">{field.label}:</span>{' '}
                          <span className="text-foreground">{value}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // 情况2：单体模块（基本信息等）
        return (
          <div key={module.instanceId} className="space-y-2">
            {renderTitle()}
            <div className="space-y-3">
              {config.fields.map((field) => {
                const value = module.data[field.id]
                if (!value) return null

                if (field.type === 'textarea') {
                  return (
                    <div key={field.id} className="mt-1 text-foreground whitespace-pre-wrap">
                      <span className="font-semibold">{field.label}:</span>
                      <br />
                      {value}
                    </div>
                  )
                }

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
