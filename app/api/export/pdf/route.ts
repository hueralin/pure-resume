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
    
    // 设置视口宽度为595px（匹配预览宽度），高度设置足够大以容纳内容
    await page.setViewport({ width: 595, height: 2000 })
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })
    
    // 等待内容完全渲染，包括字体加载
    await page.evaluate(() => document.fonts.ready)
    
    // 额外等待确保渲染完成
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 获取内容容器的实际高度
    const contentHeight = await page.evaluate(() => {
      // 查找简历容器（宽度595px的div）
      const container = document.querySelector('body > div[style*="width: 595px"]') as HTMLElement
      if (container) {
        // 使用getBoundingClientRect获取精确高度，包括padding
        const rect = container.getBoundingClientRect()
        return Math.ceil(rect.height)
      }
      // 如果没有找到，使用body的高度
      const body = document.body
      const html = document.documentElement
      return Math.ceil(Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      ))
    })
    
    // 根据实际内容高度生成PDF，宽度固定为595px（匹配预览）
    // 不设置最小高度，完全根据内容自适应
    const pdfHeight = contentHeight
    
    const pdf = await page.pdf({
      width: '595px',
      height: `${pdfHeight}px`,
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

