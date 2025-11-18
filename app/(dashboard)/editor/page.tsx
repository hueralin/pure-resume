import { Suspense } from 'react'
import { ResumeEditor } from '@/components/resume/resume-editor'

function EditorContent() {
  return <ResumeEditor />
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <EditorContent />
    </Suspense>
  )
}

