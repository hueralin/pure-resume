import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateActivationCode } from '@/lib/activation-code'
import { withAdmin } from '@/lib/middleware'
import { z } from 'zod'

const generateSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
})

/**
 * 生成激活码
 * POST /api/admin/activation-codes
 * Body: { count: number }
 */
export const POST = withAdmin(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json()
    const { count } = generateSchema.parse(body)

    const codes = []
    
    for (let i = 0; i < count; i++) {
      // 生成25位激活码格式: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
      const code = generateActivationCode()

      const activationCode = await db.activationCode.create({
        data: {
          code
        }
      })

      codes.push({
        code: activationCode.code,
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
        subscription: {
          include: {
            user: {
              select: {
                email: true
              }
            }
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
        used: !!code.subscription,
        userEmail: code.subscription?.user?.email || null,
        activatedAt: code.subscription?.startAt || null,
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
