import { ResumeData } from '@/types/resume'

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

// HTML 转义函数
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// 将样式对象转换为字符串
function styleToString(style: Record<string, any>): string {
  return Object.entries(style)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value}`
    })
    .join('; ')
}

export function generateResumeHTML(data: ResumeData): string {
  // 查找各个模块的数据
  const basicInfo = data.modules.find(m => m.moduleId === 'basic-info')?.data || {}
  const educationModule = data.modules.find(m => m.moduleId === 'education')
  const workModule = data.modules.find(m => m.moduleId === 'work-experience')
  const projectModule = data.modules.find(m => m.moduleId === 'project-experience')
  const skillsModule = data.modules.find(m => m.moduleId === 'skills')
  const certificationsModule = data.modules.find(m => m.moduleId === 'certifications')

  const themeColor = data.globalSettings?.themeColor || '#3D69F2'

  // 生成头像 HTML
  const avatarHtml = basicInfo.avatar
    ? `<div style="${styleToString({
        width: '115px',
        height: '115px',
        borderRadius: '5px',
        backgroundColor: '#e5e7eb',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flexShrink: 0,
        backgroundImage: `url(${escapeHtml(basicInfo.avatar)})`,
      })}"></div>`
    : ''

  // 生成联系方式 HTML（与预览模板保持一致：title, phone, email, location）
  const contactLeft = [
    basicInfo.title,
    basicInfo.phone,
    basicInfo.email,
    basicInfo.location,
  ].filter(Boolean).map(item => `<div>${escapeHtml(String(item))}</div>`).join('')

  const contactRight = basicInfo.website
    ? `<div>${escapeHtml(basicInfo.website)}</div>`
    : ''

  // 生成个人简介 HTML
  const summaryHtml = basicInfo.summary
    ? `
      <div style="${styleToString({ marginBottom: '20px' })}">
        <h2 style="${styleToString({
          fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.2px',
          lineHeight: '15px',
          marginBottom: '30px',
        })}">个人简介</h2>
        <div style="${styleToString({ opacity: 0.6, whiteSpace: 'pre-wrap' })}">${escapeHtml(basicInfo.summary)}</div>
      </div>
      <div style="${styleToString({
        height: '1px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
      })}"></div>
    `
    : ''

  // 生成教育经历 HTML
  const educationItems = getModuleItems(educationModule)
  const educationHtml = educationItems.length > 0
    ? `
      <div style="${styleToString({ marginBottom: '24px' })}">
        <h2 style="${styleToString({
          fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.2px',
          lineHeight: '15px',
          marginBottom: '30px',
        })}">教育经历</h2>
        <div>
          ${educationItems.map((item: any, index: number) => {
            const desc = item.degree && item.major
              ? `${item.degree}，${item.major}`
              : item.major || item.degree || ''
            return `
              <div style="${styleToString({
                marginBottom: index < educationItems.length - 1 ? '16px' : 0,
              })}">
                <div style="${styleToString({
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  marginBottom: '4px',
                })}">
                  <span style="${styleToString({
                    fontSize: '10px',
                    opacity: 0.5,
                    lineHeight: '18px',
                    width: '80px',
                  })}">${formatDate(item.startDate)} – ${formatDate(item.endDate)}</span>
                  <span style="${styleToString({
                    fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 500,
                    lineHeight: '18px',
                  })}">${escapeHtml(item.school || '')}</span>
                </div>
                ${(desc || item.description) ? `
                  <div style="${styleToString({
                    opacity: 0.6,
                    marginLeft: '90px',
                    whiteSpace: 'pre-wrap',
                  })}">
                    ${desc ? escapeHtml(desc) : ''}
                    ${item.description ? `<div style="${styleToString({ marginTop: '4px' })}">${escapeHtml(item.description)}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
    : ''

  // 生成工作经历 HTML
  const workItems = getModuleItems(workModule)
  const workHtml = workItems.length > 0
    ? `
      <div style="${styleToString({ marginBottom: '24px' })}">
        <h2 style="${styleToString({
          fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.2px',
          lineHeight: '15px',
          marginBottom: '30px',
        })}">工作经历</h2>
        <div>
          ${workItems.map((item: any, index: number) => {
            const title = item.position + (item.company ? ` @ ${item.company}` : '')
            return `
              <div style="${styleToString({
                marginBottom: index < workItems.length - 1 ? '16px' : 0,
              })}">
                <div style="${styleToString({
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  marginBottom: '4px',
                })}">
                  <span style="${styleToString({
                    fontSize: '10px',
                    opacity: 0.5,
                    lineHeight: '18px',
                    width: '80px',
                  })}">${formatDate(item.startDate)} – ${formatDate(item.endDate)}</span>
                  <span style="${styleToString({
                    fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 500,
                    lineHeight: '18px',
                  })}">${escapeHtml(title)}</span>
                </div>
                ${item.description ? `
                  <div style="${styleToString({
                    opacity: 0.6,
                    marginLeft: '90px',
                    whiteSpace: 'pre-wrap',
                  })}">${escapeHtml(item.description)}</div>
                ` : ''}
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
    : ''

  // 生成项目经历 HTML
  const projectItems = getModuleItems(projectModule)
  const projectHtml = projectItems.length > 0
    ? `
      <div style="${styleToString({ marginBottom: '24px' })}">
        <h2 style="${styleToString({
          fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.2px',
          lineHeight: '15px',
          marginBottom: '30px',
        })}">项目经历</h2>
        <div>
          ${projectItems.map((item: any, index: number) => {
            const title = item.projectName + (item.role ? ` · ${item.role}` : '')
            return `
              <div style="${styleToString({
                marginBottom: index < projectItems.length - 1 ? '16px' : 0,
              })}">
                <div style="${styleToString({
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  marginBottom: '4px',
                })}">
                  <span style="${styleToString({
                    fontSize: '10px',
                    opacity: 0.5,
                    lineHeight: '18px',
                    width: '80px',
                  })}">${formatDate(item.startDate)} – ${formatDate(item.endDate)}</span>
                  <span style="${styleToString({
                    fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 500,
                    lineHeight: '18px',
                  })}">${escapeHtml(title)}</span>
                </div>
                ${item.description ? `
                  <div style="${styleToString({
                    opacity: 0.6,
                    marginLeft: '90px',
                    whiteSpace: 'pre-wrap',
                  })}">${escapeHtml(item.description)}</div>
                ` : ''}
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
    : ''

  // 生成技能 HTML
  const skillItems = getModuleItems(skillsModule).filter((item: any) => item.skillName)
  const skillsHtml = skillItems.length > 0
    ? `
      <div style="${styleToString({ marginBottom: '24px' })}">
        <h2 style="${styleToString({
          fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.2px',
          lineHeight: '15px',
          marginBottom: '30px',
        })}">专业技能</h2>
        <div>
          ${skillItems.map((item: any) => `
            <div>
              <div style="${styleToString({
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              })}">
                <span style="${styleToString({
                  fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontWeight: 500,
                  lineHeight: '18px',
                })}">${escapeHtml(item.skillName)}</span>
                <span style="${styleToString({
                  fontSize: '10px',
                  opacity: 0.5,
                  lineHeight: '18px',
                })}">${escapeHtml(item.proficiency || '')}</span>
              </div>
              <div style="${styleToString({
                height: '3px',
                backgroundColor: '#EDEDED',
                borderRadius: '9999px',
                position: 'relative',
                marginBottom: '7px',
              })}">
                <div style="${styleToString({
                  position: 'absolute',
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: themeColor,
                  width: getProficiencyWidth(item.proficiency),
                })}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : ''

  // 生成证书 HTML
  const certItems = getModuleItems(certificationsModule).filter((item: any) => item.certName)
  const certificationsHtml = certItems.length > 0
    ? `
      <div>
        <h2 style="${styleToString({
          fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.2px',
          lineHeight: '15px',
          marginBottom: '30px',
        })}">证书荣誉</h2>
        <div>
          ${certItems.map((item: any) => `
            <div style="${styleToString({
              display: 'flex',
              flexDirection: 'column',
              lineHeight: '19px',
              marginBottom: '5px',
            })}">
              <span style="${styleToString({
                fontSize: '10px',
                opacity: 0.5,
                lineHeight: '18px',
                marginBottom: '4px',
              })}">${formatFullDate(item.issueDate)}</span>
              <span style="${styleToString({
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 500,
                lineHeight: '18px',
              })}">${escapeHtml(item.certName)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : ''

  // 组装完整 HTML
  return `
    <div style="${styleToString({
      width: '595px',
      minHeight: '842px',
      backgroundColor: '#ffffff',
      color: '#212121',
      fontFamily: 'Hind, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '40px',
      fontSize: '11px',
      lineHeight: '19px',
      boxSizing: 'border-box',
    })}">
      <!-- 头部区域 -->
      <div style="${styleToString({
        display: 'flex',
        gap: '32px',
        marginBottom: '20px',
      })}">
        ${avatarHtml}
        <div style="${styleToString({ flex: 1 })}">
          <h1 style="${styleToString({
            fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 700,
            fontSize: '24px',
            lineHeight: '25px',
            marginBottom: '16px',
          })}">${escapeHtml(basicInfo.name || '您的姓名')}</h1>
          <div style="${styleToString({
            display: 'flex',
            gap: '44px',
          })}">
            <div style="${styleToString({ opacity: 0.6 })}">
              ${contactLeft}
            </div>
            <div style="${styleToString({ opacity: 0.6 })}">
              ${contactRight}
            </div>
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div style="${styleToString({
        height: '1px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
      })}"></div>

      ${summaryHtml}

      <!-- 主体内容区 -->
      <div style="${styleToString({
        display: 'flex',
        gap: '47px',
        alignItems: 'flex-start',
      })}">
        <!-- 左栏 -->
        <div style="${styleToString({
          flex: '1 1 auto',
          maxWidth: '400px',
          minWidth: 0,
        })}">
          ${educationHtml}
          ${workHtml}
          ${projectHtml}
        </div>

        <!-- 右栏 -->
        <div style="${styleToString({
          width: '168px',
          flexShrink: 0,
        })}">
          ${skillsHtml}
          ${certificationsHtml}
        </div>
      </div>
    </div>
  `
}

