'use client'

import { useResumeStore } from '@/lib/store'
import { DefaultTemplate } from '@/templates/default'

export function ResumePreview() {
  const { currentResume } = useResumeStore()

  if (!currentResume || currentResume.modules.length === 0) {
    return (
      <div className="bg-white p-6 rounded shadow-sm min-h-[600px] flex items-center justify-center text-muted-foreground">
        <p className="text-sm">请从左侧添加模块开始编辑简历</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg" style={{ backgroundColor: '#ffffff' }}>
      <DefaultTemplate data={currentResume} />
    </div>
  )
}

