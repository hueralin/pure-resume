import { ResumeData } from '@/types/resume'

interface DefaultTemplateProps {
  data: ResumeData
}

// 格式化日期显示（年.月）
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '至今'
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
}

// 格式化完整日期显示（年.月.日）
function formatFullDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

// 获取熟练度对应的进度条宽度
function getProficiencyWidth(proficiency: string): string {
  const map: Record<string, string> = {
    '入门': '36%',
    '熟练': '60%',
    '精通': '78%',
    '专家': '84%',
  }
  return map[proficiency] || '50%'
}

// 安全获取模块的 items 数组
function getModuleItems(module: any): any[] {
  return module?.data?.items || []
}

export function DefaultTemplateServer({ data }: DefaultTemplateProps) {
  // 查找各个模块的数据
  const basicInfo = data.modules.find(m => m.moduleId === 'basic-info')?.data || {}
  const educationModule = data.modules.find(m => m.moduleId === 'education')
  const workModule = data.modules.find(m => m.moduleId === 'work-experience')
  const projectModule = data.modules.find(m => m.moduleId === 'project-experience')
  const skillsModule = data.modules.find(m => m.moduleId === 'skills')
  const certificationsModule = data.modules.find(m => m.moduleId === 'certifications')

  const themeColor = data.globalSettings?.themeColor || '#3D69F2'

  // 共用样式
  const styles = {
    container: {
      width: '595px',
      backgroundColor: '#ffffff',
      color: '#212121',
      fontFamily: 'Hind, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '40px',
      fontSize: '11px',
      lineHeight: '19px',
      boxSizing: 'border-box' as const,
    },
    header: {
      display: 'flex',
      gap: '32px',
      marginBottom: '20px',
    },
    avatar: {
      width: '115px',
      height: '115px',
      borderRadius: '5px',
      backgroundColor: '#e5e7eb',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      flexShrink: 0,
    },
    title: {
      fontSize: '10px',
      letterSpacing: '0.8px',
      opacity: 0.6,
      marginBottom: '4px',
      lineHeight: '10px',
    },
    name: {
      fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 700,
      fontSize: '24px',
      lineHeight: '25px',
      marginBottom: '16px',
    },
    contactGrid: {
      display: 'flex',
      gap: '44px',
    },
    contactColumn: {
      opacity: 0.6,
    },
    divider: {
      height: '1px',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 700,
      fontSize: '13px',
      letterSpacing: '0.2px',
      lineHeight: '15px',
      marginBottom: '30px',
    },
    mainContent: {
      display: 'flex',
      gap: '47px',
    },
    leftColumn: {
      flex: 1,
      maxWidth: '400px',
    },
    rightColumn: {
      width: '168px',
    },
    itemRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '10px',
      marginBottom: '4px',
    },
    dateText: {
      fontSize: '10px',
      opacity: 0.5,
      lineHeight: '18px',
      width: '80px',
    },
    itemTitle: {
      fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 500,
      lineHeight: '18px',
    },
    itemDesc: {
      opacity: 0.6,
      marginLeft: '90px',
      whiteSpace: 'pre-wrap' as const,
    },
    skillRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
    },
    progressBar: {
      height: '3px',
      backgroundColor: '#EDEDED',
      borderRadius: '9999px',
      position: 'relative' as const,
      marginBottom: '7px',
    },
    progressFill: {
      position: 'absolute' as const,
      height: '100%',
      borderRadius: '9999px',
      backgroundColor: themeColor,
    },
    certRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      lineHeight: '19px',
      marginBottom: '5px',
    },
  }

  return (
    <div style={styles.container}>
      {/* 头部区域 */}
      <div style={styles.header}>
        {/* 头像 */}
        {basicInfo.avatar && (
          <div 
            style={{
              ...styles.avatar,
              backgroundImage: `url(${basicInfo.avatar})`,
            }}
          />
        )}

        {/* 姓名和联系方式 */}
        <div style={{ flex: 1 }}>
          {/* 姓名 */}
          <h1 style={styles.name}>
            {basicInfo.name || '您的姓名'}
          </h1>

          {/* 联系方式 - 两列布局（与预览一致：title, phone, email, location） */}
          <div style={styles.contactGrid}>
            <div style={styles.contactColumn}>
              {basicInfo.title && <div>{basicInfo.title}</div>}
              {basicInfo.phone && <div>{basicInfo.phone}</div>}
              {basicInfo.email && <div>{basicInfo.email}</div>}
              {basicInfo.location && <div>{basicInfo.location}</div>}
            </div>
            <div style={styles.contactColumn}>
              {basicInfo.website && <div>{basicInfo.website}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div style={styles.divider} />

      {/* 个人简介 Profile */}
      {basicInfo.summary && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={styles.sectionTitle}>
              个人简介
            </h2>
            <div style={{ opacity: 0.6, whiteSpace: 'pre-wrap' }}>
              {basicInfo.summary}
            </div>
          </div>
          <div style={styles.divider} />
        </>
      )}

      {/* 主体内容区 - 两栏布局 */}
      <div style={styles.mainContent}>
        {/* 左栏 */}
        <div style={styles.leftColumn}>
          {/* 教育背景 */}
          {getModuleItems(educationModule).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={styles.sectionTitle}>
                教育经历
              </h2>
              <div>
                {getModuleItems(educationModule).map((item: any, index: number) => {
                  const items = getModuleItems(educationModule)
                  return (
                  <div key={index} style={{ marginBottom: index < items.length - 1 ? '16px' : 0 }}>
                    <div style={styles.itemRow}>
                      <span style={styles.dateText}>
                        {formatDate(item.startDate)} – {formatDate(item.endDate)}
                      </span>
                      <span style={styles.itemTitle}>
                        {item.school}
                      </span>
                    </div>
                    {(item.major || item.degree || item.description) && (
                      <div style={styles.itemDesc}>
                        {item.degree && item.major ? `${item.degree}，${item.major}` : item.major || item.degree}
                        {item.description && <div style={{ marginTop: '4px' }}>{item.description}</div>}
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 工作经历 */}
          {getModuleItems(workModule).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={styles.sectionTitle}>
                工作经历
              </h2>
              <div>
                {getModuleItems(workModule).map((item: any, index: number) => (
                  <div key={index} style={{ marginBottom: index < getModuleItems(workModule).length - 1 ? '16px' : 0 }}>
                    <div style={styles.itemRow}>
                      <span style={styles.dateText}>
                        {formatDate(item.startDate)} – {formatDate(item.endDate)}
                      </span>
                      <span style={styles.itemTitle}>
                        {item.position}{item.company ? ` @ ${item.company}` : ''}
                      </span>
                    </div>
                    {item.description && (
                      <div style={styles.itemDesc}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 项目经历 */}
          {getModuleItems(projectModule).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={styles.sectionTitle}>
                项目经历
              </h2>
              <div>
                {getModuleItems(projectModule).map((item: any, index: number) => (
                  <div key={index} style={{ marginBottom: index < getModuleItems(projectModule).length - 1 ? '16px' : 0 }}>
                    <div style={styles.itemRow}>
                      <span style={styles.dateText}>
                        {formatDate(item.startDate)} – {formatDate(item.endDate)}
                      </span>
                      <span style={styles.itemTitle}>
                        {item.projectName}{item.role ? ` · ${item.role}` : ''}
                      </span>
                    </div>
                    {item.description && (
                      <div style={styles.itemDesc}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏 */}
        <div style={styles.rightColumn}>
          {/* 技能 */}
          {getModuleItems(skillsModule).filter((item: any) => item.skillName).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={styles.sectionTitle}>
                专业技能
              </h2>
              <div>
                {getModuleItems(skillsModule).filter((item: any) => item.skillName).map((item: any, index: number) => (
                  <div key={index}>
                    <div style={styles.skillRow}>
                      <span style={styles.itemTitle}>
                        {item.skillName}
                      </span>
                      <span style={{ fontSize: '10px', opacity: 0.5, lineHeight: '18px' }}>
                        {item.proficiency}
                      </span>
                    </div>
                    {/* 进度条 */}
                    <div style={styles.progressBar}>
                      <div 
                        style={{ 
                          ...styles.progressFill,
                          width: getProficiencyWidth(item.proficiency),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 证书 */}
          {getModuleItems(certificationsModule).filter((item: any) => item.certName).length > 0 && (
            <div>
              <h2 style={styles.sectionTitle}>
                证书荣誉
              </h2>
              <div>
                {getModuleItems(certificationsModule).filter((item: any) => item.certName).map((item: any, index: number) => (
                  <div key={index} style={styles.certRow}>
                    <span style={styles.itemTitle}>
                      {item.certName}
                    </span>
                    <span style={{ fontSize: '10px', opacity: 0.5, lineHeight: '18px' }}>
                      {formatFullDate(item.issueDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
