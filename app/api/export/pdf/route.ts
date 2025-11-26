import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import puppeteer from 'puppeteer'
import { db } from '@/lib/db'
import { ResumeData } from '@/types/resume'
import { renderResumeToHTML } from '@/lib/resume-html-renderer'

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

    // 使用 server.tsx 组件渲染 HTML，确保与预览一致
    const resumeData = resume.data as ResumeData
    const htmlContent = await renderResumeToHTML(resumeData)

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
            html, body {
              width: 100%;
              height: 100%;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 0;
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
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    })

    await browser.close()

    // 生成文件名（使用简历标题，如果标题包含特殊字符则进行清理）
    const safeTitle = resume.title
      .replace(/[<>:"/\\|?*]/g, '') // 移除文件名不允许的字符
      .trim() || 'resume'
    const fileName = `${safeTitle}.pdf`

    // 返回 PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export PDF:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导出PDF失败' },
      { status: 500 }
    )
  }
  })(request)
}

