'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ResumeCardProps {
  id: string
  title: string
  updatedAt: string
  onDelete: (id: string) => void
  onDownload: (id: string) => void
}

export function ResumeCard({ id, title, updatedAt, onDelete, onDownload }: ResumeCardProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEdit = () => {
    router.push(`/resume/${id}`)
  }

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload(id)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(id)
    setIsDeleteDialogOpen(false)
  }

  return (
    <Card
      className="group relative cursor-pointer w-[240px] h-[320px] bg-card border-0 rounded overflow-hidden hover:opacity-90 hover:scale-105 transition-all duration-200"
      onClick={handleEdit}
    >
      <CardContent className="h-full p-0 flex flex-col">
        {/* 卡片主体区域 - 留空用于未来显示预览图 */}
        <div className="flex-1" />
        
        {/* 底部信息区域 */}
        <div className="px-[16px] pb-[19px] space-y-[11px]">
          {/* 简历标题 */}
          <div className="h-2.5 flex items-center">
            <span className="text-foreground text-sm truncate w-full">
              {title}
            </span>
          </div>
          {/* 更新时间 */}
          <div className="h-[23px] flex items-center">
            <span className="text-muted-foreground text-xs truncate w-full">
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
            variant="ghost"
            size="icon"
            onClick={handleDownloadClick}
            className="h-8 w-8 border-0 hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer"
            title="下载PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsDeleteDialogOpen(true)
                }}
                className="h-8 w-8 border-0 hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer"
                title="删除简历"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>确定要删除简历&ldquo;{title}&rdquo;吗？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作无法撤销。这将永久删除您的简历数据。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => {
                    e.stopPropagation()
                    setIsDeleteDialogOpen(false)
                }}>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

