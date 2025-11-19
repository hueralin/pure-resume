'use client'

import { useResumeStore } from '@/lib/store'
import { DefaultTemplate } from '@/templates/default'

import { Card, CardContent } from '@/components/ui/card'

export function ResumePreview() {
  const { currentResume } = useResumeStore()

  if (!currentResume || currentResume.modules.length === 0) {
    return (
      <Card className="min-h-[600px] flex items-center justify-center bg-card border-border shadow-sm">
        <CardContent>
          <p className="text-sm text-muted-foreground">请从左侧添加模块开始编辑简历</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="bg-card border border-border shadow-lg">
      <DefaultTemplate data={currentResume} />
    </div>
  )
}

