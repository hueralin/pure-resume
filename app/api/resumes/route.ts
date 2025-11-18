import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { ResumeData } from '@/types/resume'

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const resumes = await db.resume.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        templateId: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(resumes)
  } catch (error) {
    console.error('Failed to fetch resumes:', error)
    return NextResponse.json(
      { error: '获取简历列表失败' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json()
    const { title, data, resumeId } = body

    if (!title || !data) {
      return NextResponse.json(
        { error: '标题和数据不能为空' },
        { status: 400 }
      )
    }

    let resume
    if (resumeId) {
      // 更新现有简历
      resume = await db.resume.update({
        where: { id: resumeId, userId },
        data: {
          title,
          data: data as ResumeData,
        },
      })
    } else {
      // 创建新简历
      resume = await db.resume.create({
        data: {
          userId,
          title,
          data: data as ResumeData,
        },
      })
    }

    return NextResponse.json(resume)
  } catch (error) {
    console.error('Failed to save resume:', error)
    return NextResponse.json(
      { error: '保存简历失败' },
      { status: 500 }
    )
  }
})

