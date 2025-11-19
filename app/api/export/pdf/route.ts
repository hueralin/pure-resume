import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import puppeteer from 'puppeteer'
import { db } from '@/lib/db'
import { getModuleConfig } from '@/lib/modules'
import { ResumeData } from '@/types/resume'

export async function POST(request: NextRequest) {
  return withAuth(async (req: NextRequest, userId: string) => {
  try {
    const body = await request.json()
    const { resumeId } = body

    if (!resumeId) {
      return NextResponse.json(
        { error: '简历ID不能为空' },
        { status: 400 }
      )
    }

    // 获取简历数据
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId },
    })

    if (!resume) {
      return NextResponse.json(
        { error: '简历不存在' },
        { status: 404 }
      )
    }

    // 生成 HTML 字符串
    const resumeData = resume.data as ResumeData
    const htmlContent = generateResumeHTML(resumeData)

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `

    // 使用 Puppeteer 生成 PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(fullHtml, { waitUntil: 'load' })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    })

    await browser.close()

    // 返回 PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${resumeId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Failed to export PDF:', error)
    return NextResponse.json(
      { error: '导出PDF失败' },
      { status: 500 }
    )
  }
  })(request)
}

// 生成简历 HTML 内容的纯函数
function generateResumeHTML(data: ResumeData): string {
  if (!data.modules || data.modules.length === 0) {
    return '<div style="padding: 48px; text-align: center; color: #64748b;">暂无内容</div>'
  }

  const modulesHTML = data.modules.map((module, index) => {
    const config = getModuleConfig(module.moduleId)
    if (!config) return ''

    const fieldsHTML = config.fields
      .map((field) => {
        const value = module.data[field.id]
        if (!value) return ''

        return `
          <div style="display: flex; flex-direction: row; gap: 16px; margin-bottom: 16px;">
            <span style="font-weight: 500; font-size: 14px; color: #64748b; min-width: 96px; flex-shrink: 0;">
              ${escapeHtml(field.label)}
            </span>
            <span style="font-size: 16px; color: #1e293b; flex: 1;">
              ${escapeHtml(String(value))}
            </span>
          </div>
        `
      })
      .join('')

    return `
      <div style="margin-bottom: ${index < data.modules.length - 1 ? '32px' : '0'}; padding-top: ${index > 0 ? '32px' : '0'}; border-top: ${index > 0 ? '1px solid #f1f5f9' : 'none'};">
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 600; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.2;">
            ${escapeHtml(config.name)}
          </h2>
          <div style="height: 2px; width: 48px; background-color: #6366f1; border-radius: 1px;"></div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${fieldsHTML}
        </div>
      </div>
    `
  }).join('')

  return `
    <div style="min-height: 100vh; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 896px; margin: 0 auto; padding: 48px 24px;">
        <div style="background-color: #ffffff; border-radius: 4px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; overflow: hidden;">
          <div style="padding: 48px;">
            ${modulesHTML}
          </div>
        </div>
      </div>
    </div>
  `
}

// HTML 转义函数
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

