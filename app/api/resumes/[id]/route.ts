import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req: NextRequest, userId: string) => {
    try {
      const { id } = await params
      const resume = await db.resume.findFirst({
        where: { id, userId },
      })

      if (!resume) {
        return NextResponse.json(
          { error: '简历不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json(resume)
    } catch (error) {
      console.error('Failed to fetch resume:', error)
      return NextResponse.json(
        { error: '获取简历失败' },
        { status: 500 }
      )
    }
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req: NextRequest, userId: string) => {
    try {
      const { id } = await params
      await db.resume.delete({
        where: { id, userId },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to delete resume:', error)
      return NextResponse.json(
        { error: '删除简历失败' },
        { status: 500 }
      )
    }
  })(request)
}

