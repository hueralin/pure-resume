'use client'

import { Card } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface AddResumeCardProps {
  onClick: () => void
}

export function AddResumeCard({ onClick }: AddResumeCardProps) {
  return (
    <Card
      className="cursor-pointer w-[240px] h-[320px] hover:opacity-90 hover:scale-105 transition-all duration-200"
      onClick={onClick}
      styles={{
        body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }
      }}
    >
      {/* 卡片主体区域 - 显示加号图标 */}
      <div className="flex-1 flex items-center justify-center">
        <PlusOutlined className="text-4xl" />
      </div>
      
      {/* 底部信息区域 */}
      <div className="px-[16px] pb-[19px] space-y-[11px]">
        {/* 大标题 */}
        <div className="h-2.5 flex items-center">
          <span className="text-sm truncate w-full">
            创建新简历
          </span>
        </div>
        {/* 小标题 */}
        <div className="h-[23px] flex items-center">
          <span className="text-gray-500 text-xs truncate w-full">
            从头开始构建
          </span>
        </div>
      </div>
    </Card>
  )
}

