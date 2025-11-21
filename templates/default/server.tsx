import { ResumeData } from '@/types/resume'
import { getModuleConfig } from '@/lib/modules'

interface DefaultTemplateProps {
  data: ResumeData
}

export function DefaultTemplateServer({ data }: DefaultTemplateProps) {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '48px' }}>
            {data.modules.map((module, index) => {
              const config = getModuleConfig(module.moduleId)
              if (!config) return null

              // 教育经历模块特殊处理：显示多个教育经历项
              if (module.moduleId === 'education' && module.data.items && Array.isArray(module.data.items)) {
                return (
                  <div 
                    key={module.instanceId}
                    style={{
                      marginBottom: index < data.modules.length - 1 ? '32px' : '0',
                      paddingTop: index > 0 ? '32px' : '0',
                      borderTop: index > 0 ? '1px solid #f1f5f9' : 'none'
                    }}
                  >
                    <div style={{ marginBottom: '24px' }}>
                      <h2 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#0f172a',
                        letterSpacing: '-0.02em',
                        marginBottom: '8px',
                        lineHeight: '1.2'
                      }}>
                        {config.name}
                      </h2>
                      <div style={{
                        height: '2px',
                        width: '48px',
                        backgroundColor: '#6366f1',
                        borderRadius: '1px'
                      }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {module.data.items.map((item: any, itemIndex: number) => (
                        <div 
                          key={itemIndex}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            paddingBottom: itemIndex < module.data.items.length - 1 ? '24px' : '0',
                            borderBottom: itemIndex < module.data.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                          }}
                        >
                          {item.school && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '16px'
                            }}>
                              <span style={{
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#64748b',
                                minWidth: '96px',
                                flexShrink: 0
                              }}>
                                学校名称
                              </span>
                              <span style={{
                                fontSize: '16px',
                                color: '#1e293b',
                                flex: 1
                              }}>
                                {item.school}
                              </span>
                            </div>
                          )}
                          {item.major && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '16px'
                            }}>
                              <span style={{
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#64748b',
                                minWidth: '96px',
                                flexShrink: 0
                              }}>
                                专业
                              </span>
                              <span style={{
                                fontSize: '16px',
                                color: '#1e293b',
                                flex: 1
                              }}>
                                {item.major}
                              </span>
                            </div>
                          )}
                          {item.degree && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '16px'
                            }}>
                              <span style={{
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#64748b',
                                minWidth: '96px',
                                flexShrink: 0
                              }}>
                                学历
                              </span>
                              <span style={{
                                fontSize: '16px',
                                color: '#1e293b',
                                flex: 1
                              }}>
                                {item.degree}
                              </span>
                            </div>
                          )}
                          {item.startDate && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '16px'
                            }}>
                              <span style={{
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#64748b',
                                minWidth: '96px',
                                flexShrink: 0
                              }}>
                                时间
                              </span>
                              <span style={{
                                fontSize: '16px',
                                color: '#1e293b',
                                flex: 1
                              }}>
                                {item.endDate ? `${item.startDate} - ${item.endDate}` : `${item.startDate} - 至今`}
                              </span>
                            </div>
                          )}
                          {item.description && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '16px'
                            }}>
                              <span style={{
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#64748b',
                                minWidth: '96px',
                                flexShrink: 0
                              }}>
                                描述
                              </span>
                              <span style={{
                                fontSize: '16px',
                                color: '#1e293b',
                                flex: 1
                              }}>
                                {item.description}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              return (
                <div 
                  key={module.instanceId}
                  style={{
                    marginBottom: index < data.modules.length - 1 ? '32px' : '0',
                    paddingTop: index > 0 ? '32px' : '0',
                    borderTop: index > 0 ? '1px solid #f1f5f9' : 'none'
                  }}
                >
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#0f172a',
                      letterSpacing: '-0.02em',
                      marginBottom: '8px',
                      lineHeight: '1.2'
                    }}>
                      {config.name}
                    </h2>
                    <div style={{
                      height: '2px',
                      width: '48px',
                      backgroundColor: '#6366f1',
                      borderRadius: '1px'
                    }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {config.fields.map((field) => {
                      const value = module.data[field.id]
                      if (!value) return null

                      return (
                        <div 
                          key={field.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '16px'
                          }}
                        >
                          <span style={{
                            fontWeight: '500',
                            fontSize: '14px',
                            color: '#64748b',
                            minWidth: '96px',
                            flexShrink: 0
                          }}>
                            {field.label}
                          </span>
                          <span style={{
                            fontSize: '16px',
                            color: '#1e293b',
                            flex: 1
                          }}>
                            {value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

