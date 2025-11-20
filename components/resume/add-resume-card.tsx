'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'

interface AddResumeCardProps {
  onClick: () => void
}

export function AddResumeCard({ onClick }: AddResumeCardProps) {
  return (
    <Card
      className="cursor-pointer w-[240px] h-[320px] bg-card border-0 rounded overflow-hidden hover:opacity-90 hover:scale-105 transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="h-full p-0 flex flex-col">
        {/* 卡片主体区域 - 显示加号图标 */}
        <div className="flex-1 flex items-center justify-center">
          <Plus className="h-16 w-16 text-foreground" strokeWidth={1} />
        </div>
        
        {/* 底部信息区域 */}
        <div className="px-[16px] pb-[19px] space-y-[11px]">
          {/* 大标题 */}
          <div className="h-2.5 flex items-center">
            <span className="text-foreground text-sm truncate w-full">
              创建新简历
            </span>
          </div>
          {/* 小标题 */}
          <div className="h-[23px] flex items-center">
            <span className="text-muted-foreground text-xs truncate w-full">
              从头开始构建
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

