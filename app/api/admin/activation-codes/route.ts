import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateActivationCode } from '@/lib/activation-code'
import { withAdmin } from '@/lib/middleware'
import { z } from 'zod'

const generateSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
  days: z.number().int().min(1).max(3650).default(90), // 激活码有效期（天），最大10年，默认90天
})

/**
 * 生成激活码
 * POST /api/admin/activation-codes
 * Body: { count: number, days: number }
 */
export const POST = withAdmin(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json()
    const { count, days } = generateSchema.parse(body)

    const codes = []
    
    for (let i = 0; i < count; i++) {
      // 生成25位激活码格式: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
      const code = generateActivationCode()

      // 计算激活码过期时间（生成时的有效期，不是激活后的有效期）
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)

      const activationCode = await db.activationCode.create({
        data: {
          code,
          expiresAt
        }
      })

      codes.push({
        code: activationCode.code,
        expiresAt: activationCode.expiresAt,
        createdAt: activationCode.createdAt
      })
    }

    return NextResponse.json({
      success: true,
      count: codes.length,
      codes
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Failed to generate activation codes:', error)
    return NextResponse.json(
      { error: '生成激活码失败' },
      { status: 500 }
    )
  }
})

/**
 * 查询所有激活码（包括使用状态）
 * GET /api/admin/activation-codes
 */
export const GET = withAdmin(async (request: NextRequest, userId: string) => {
  try {
    const codes = await db.activationCode.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      count: codes.length,
      codes: codes.map(code => ({
        code: code.code,
        used: !!code.userId,
        userId: code.userId,
        user: code.user ? {
          email: code.user.email,
          name: code.user.name
        } : null,
        expiresAt: code.expiresAt,
        activatedAt: code.activatedAt,
        createdAt: code.createdAt
      }))
    })
  } catch (error) {
    console.error('Failed to get activation codes:', error)
    return NextResponse.json(
      { error: '获取激活码列表失败' },
      { status: 500 }
    )
  }
})
