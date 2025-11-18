import { ResumeData } from '@/types/resume'
import { getModuleConfig } from '@/lib/modules'

interface DefaultTemplateProps {
  data: ResumeData
}

export function DefaultTemplateServer({ data }: DefaultTemplateProps) {
  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif', color: '#000' }}>
      {data.modules.map((module) => {
        const config = getModuleConfig(module.moduleId)
        if (!config) return null

        return (
          <div key={module.instanceId} style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                borderBottom: '2px solid #000',
                paddingBottom: '8px',
                marginBottom: '16px',
                color: '#000',
              }}
            >
              {config.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {config.fields.map((field) => {
                const value = module.data[field.id]
                if (!value) return null

                return (
                  <div key={field.id} style={{ color: '#000' }}>
                    <span style={{ fontWeight: '600', color: '#000' }}>{field.label}:</span>{' '}
                    <span style={{ color: '#000' }}>{value}</span>
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

