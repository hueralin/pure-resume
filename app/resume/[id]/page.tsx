import { Suspense } from 'react'
import { ResumeEditor } from '@/components/resume/resume-editor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResumeEditorPage(props: PageProps) {
  const { id } = await props.params
  
  // 如果是新建简历（id='new'），传递 undefined 给 editor，让其自行初始化
  const resumeId = id === 'new' ? undefined : id

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <ResumeEditor resumeId={resumeId} />
    </Suspense>
  )
}

