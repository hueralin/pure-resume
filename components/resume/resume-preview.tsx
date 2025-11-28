'use client'

import { useResumeStore } from '@/lib/store'
import { DefaultTemplate } from '@/templates/default'
import { Card } from 'antd'

export function ResumePreview() {
  const { currentResume } = useResumeStore()

  if (!currentResume || currentResume.modules.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-500">请从左侧添加模块开始编辑简历</p>
      </Card>
    )
  }

  return (
    <div className="border shadow-lg" style={{ width: '595px' }}>
      <DefaultTemplate data={currentResume} />
    </div>
  )
}

