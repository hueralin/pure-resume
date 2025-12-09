'use client'

import { ResumeData, ResumeModuleData } from '@/types/resume'

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
    'master': '100%',
  }
  return map[proficiency] || '50%'
}

// 安全获取模块的 items 数组
function getModuleItems(module: any): any[] {
  return module?.data?.items || []
}

// --- 模块渲染组件 ---

function EducationSection({ module }: { module: ResumeModuleData }) {
  const items = getModuleItems(module)
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="font-['IBM_Plex_Sans',sans-serif] font-bold text-[13px] tracking-[0.2px] mb-[15px]" style={{ lineHeight: '15px' }}>
        教育经历
      </h2>
      <div className="space-y-4">
        {items.map((item: any, index: number) => (
          <div key={index}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-['IBM_Plex_Sans',sans-serif] font-medium" style={{ lineHeight: '18px' }}>
                {item.school}
              </span>
              <span className="text-[10px] opacity-50 flex-shrink-0" style={{ lineHeight: '18px' }}>
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </span>
            </div>
            {(item.major || item.degree || item.description) && (
              <div className="opacity-60">
                {item.degree && item.major ? `${item.degree}，${item.major}` : item.major || item.degree}
                {item.description && <div className="mt-1 whitespace-pre-wrap">{item.description}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkExperienceSection({ module }: { module: ResumeModuleData }) {
  const items = getModuleItems(module)
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="font-['IBM_Plex_Sans',sans-serif] font-bold text-[13px] tracking-[0.2px] mb-[15px]" style={{ lineHeight: '15px' }}>
        工作经历
      </h2>
      <div className="space-y-4">
        {items.map((item: any, index: number) => (
          <div key={index}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-['IBM_Plex_Sans',sans-serif] font-medium" style={{ lineHeight: '18px' }}>
                {item.position}{item.company ? ` @ ${item.company}` : ''}
              </span>
              <span className="text-[10px] opacity-50 flex-shrink-0" style={{ lineHeight: '18px' }}>
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </span>
            </div>
            {item.description && (
              <div className="opacity-60 whitespace-pre-wrap">
                {item.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjectExperienceSection({ module }: { module: ResumeModuleData }) {
  const items = getModuleItems(module)
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="font-['IBM_Plex_Sans',sans-serif] font-bold text-[13px] tracking-[0.2px] mb-[15px]" style={{ lineHeight: '15px' }}>
        项目经历
      </h2>
      <div className="space-y-4">
        {items.map((item: any, index: number) => (
          <div key={index}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-['IBM_Plex_Sans',sans-serif] font-medium" style={{ lineHeight: '18px' }}>
                {item.projectName}{item.role ? ` · ${item.role}` : ''}
              </span>
              <span className="text-[10px] opacity-50 flex-shrink-0" style={{ lineHeight: '18px' }}>
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </span>
            </div>
            {item.description && (
              <div className="opacity-60 whitespace-pre-wrap">
                {item.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsSection({ module, themeColor }: { module: ResumeModuleData; themeColor: string }) {
  const items = getModuleItems(module).filter((item: any) => item.skillName)
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="font-['IBM_Plex_Sans',sans-serif] font-bold text-[13px] tracking-[0.2px] mb-[15px]" style={{ lineHeight: '15px' }}>
        专业技能
      </h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        {items.map((item: any, index: number) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-[6px]">
              <span className="font-['IBM_Plex_Sans',sans-serif] font-medium" style={{ lineHeight: '18px' }}>
                {item.skillName}
              </span>
              <span className="text-[10px] opacity-50" style={{ lineHeight: '18px' }}>
                {item.proficiency}
              </span>
            </div>
            {/* 进度条 */}
            <div className="h-[3px] bg-[#EDEDED] rounded-full relative">
              <div 
                className="absolute h-full rounded-full"
                style={{ 
                  width: getProficiencyWidth(item.proficiency),
                  backgroundColor: themeColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CertificationsSection({ module }: { module: ResumeModuleData }) {
  const items = getModuleItems(module).filter((item: any) => item.certName)
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="font-['IBM_Plex_Sans',sans-serif] font-bold text-[13px] tracking-[0.2px] mb-[15px]" style={{ lineHeight: '15px' }}>
        证书荣誉
      </h2>
      <div className="space-y-[5px]">
        {items.map((item: any, index: number) => (
          <div key={index} className="flex flex-col" style={{ lineHeight: '19px' }}>
            <div className="flex justify-between items-baseline">
              <span className="font-['IBM_Plex_Sans',sans-serif] font-medium" style={{ lineHeight: '18px' }}>
                {item.certName}
              </span>
              <span className="text-[10px] opacity-50 flex-shrink-0" style={{ lineHeight: '18px' }}>
                {formatFullDate(item.issueDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DefaultTemplate({ data }: DefaultTemplateProps) {
  // 查找各个模块的数据
  const basicInfo = data.modules.find(m => m.moduleId === 'basic-info')?.data || {}
  const themeColor = data.globalSettings?.themeColor || '#3D69F2'

  // 过滤出除了 basic-info 之外的所有模块，并保留它们在 data.modules 中的顺序
  const contentModules = data.modules.filter(m => m.moduleId !== 'basic-info')

  return (
    <div 
      className="bg-white text-[#212121] font-['Hind',sans-serif]"
      style={{ 
        width: '595px',
        minHeight: '842px',
        padding: '40px',
        fontSize: '11px',
        lineHeight: '19px',
        boxSizing: 'border-box',
      }}
    >
      {/* 头部区域 */}
      <div className="flex gap-8 mb-5">
        {/* 头像 */}
        {basicInfo.avatar && <div 
          className="w-[115px] h-[115px] rounded-[5px] bg-gray-200 flex-shrink-0 overflow-hidden"
          style={{ 
            backgroundImage: basicInfo.avatar ? `url(${basicInfo.avatar})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>}

        {/* 姓名和联系方式 */}
        <div className="flex-1">
          {/* 姓名 */}
          <h1 
            className="font-['IBM_Plex_Sans',sans-serif] font-bold text-[24px] mb-4"
            style={{ lineHeight: '25px' }}
          >
            {basicInfo.name || '您的姓名'}
          </h1>

          {/* 联系方式 - 两列布局 */}
          <div className="flex gap-[44px]">
            <div className="space-y-0 opacity-60">
              {basicInfo.title && <div>{basicInfo.title}</div>}
              {basicInfo.phone && <div>{basicInfo.phone}</div>}
              {basicInfo.email && <div>{basicInfo.email}</div>}
              {basicInfo.location && <div>{basicInfo.location}</div>}
            </div>
            <div className="space-y-0 opacity-60">
              {basicInfo.website && <div>{basicInfo.website}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-[1px] bg-black/10 mb-5" />

      {/* 个人简介 Profile */}
      {basicInfo.summary && (
        <>
          <div className="mb-5">
            <h2 className="font-['IBM_Plex_Sans',sans-serif] font-bold text-[13px] tracking-[0.2px] mb-[10px]" style={{ lineHeight: '15px' }}>
              个人简介
            </h2>
            <div className="opacity-60 whitespace-pre-wrap">
              {basicInfo.summary}
            </div>
          </div>
          <div className="h-[1px] bg-black/10 mb-5" />
        </>
      )}

      {/* 主体内容区 - 单栏布局，动态渲染 */}
      <div className="flex flex-col gap-6">
        {contentModules.map(module => {
          switch (module.moduleId) {
            case 'education':
              return <EducationSection key={module.instanceId} module={module} />
            case 'work-experience':
              return <WorkExperienceSection key={module.instanceId} module={module} />
            case 'project-experience':
              return <ProjectExperienceSection key={module.instanceId} module={module} />
            case 'skills':
              return <SkillsSection key={module.instanceId} module={module} themeColor={themeColor} />
            case 'certifications':
              return <CertificationsSection key={module.instanceId} module={module} />
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}
