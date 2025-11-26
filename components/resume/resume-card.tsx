'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Modal } from 'antd'
import { DownloadOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons'

interface ResumeCardProps {
  id: string
  title: string
  updatedAt: string
  onDelete: (id: string) => void
  onDownload: (id: string) => Promise<void>
}

export function ResumeCard({ id, title, updatedAt, onDelete, onDownload }: ResumeCardProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleEdit = () => {
    router.push(`/resume/${id}`)
  }

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDownloading) return
    
    setIsDownloading(true)
    try {
      await onDownload(id)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    onDelete(id)
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <Card
        className="group relative cursor-pointer w-[240px] h-[320px] hover:opacity-90 hover:scale-105 transition-all duration-200"
        onClick={handleEdit}
        styles={{
          body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }
        }}
      >
        {/* 卡片主体区域 - 留空用于未来显示预览图 */}
        <div className="flex-1" />
        
        {/* 底部信息区域 */}
        <div className="px-[16px] pb-[19px] space-y-[11px]">
          {/* 简历标题 */}
          <div className="h-2.5 flex items-center">
            <span className="text-sm truncate w-full">
              {title}
            </span>
          </div>
          {/* 更新时间 */}
          <div className="h-[23px] flex items-center">
            <span className="text-gray-500 text-xs truncate w-full">
              最近更新于 {new Date(updatedAt).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* 悬浮操作按钮 */}
        <div 
          className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="text"
            icon={isDownloading ? <LoadingOutlined /> : <DownloadOutlined />}
            onClick={handleDownloadClick}
            title="下载PDF"
            size="small"
            loading={isDownloading}
            disabled={isDownloading}
          />
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setIsDeleteDialogOpen(true)
            }}
            title="删除简历"
            size="small"
          />
        </div>
      </Card>
      
      <Modal
        open={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onOk={handleDelete}
        title="确认删除"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除简历&ldquo;{title}&rdquo;吗？</p>
        <p className="text-gray-500 text-sm mt-2">此操作无法撤销。这将永久删除您的简历数据。</p>
      </Modal>
    </>
  )
}

