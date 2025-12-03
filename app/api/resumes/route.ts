import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { requireSubscription } from '@/lib/subscription'
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
    // 检查订阅状态
    const subscription = await requireSubscription(userId)
    if (!subscription.valid) {
      // 根据订阅状态返回不同的错误消息
      const errorMessage = subscription.status.state === 'none'
        ? '您还没有激活订阅，无法保存简历。请使用激活码激活后使用完整功能。'
        : '订阅已过期，无法保存简历。您可以导出PDF或删除简历，或使用激活码续费。'
      
      const errorCode = subscription.status.state === 'none'
        ? 'SUBSCRIPTION_REQUIRED'
        : 'SUBSCRIPTION_EXPIRED'

      return NextResponse.json(
        {
          error: errorMessage,
          code: errorCode,
          state: subscription.status.state,
          expiresAt: subscription.status.expiresAt,
          allowedActions: ['export', 'delete']
        },
        { status: 403 }
      )
    }

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

