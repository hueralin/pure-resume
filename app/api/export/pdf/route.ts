import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import puppeteer from 'puppeteer'
import { db } from '@/lib/db'
import { DefaultTemplateServer } from '@/templates/default/server'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

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

    // 渲染 HTML
    const html = renderToStaticMarkup(
      React.createElement(DefaultTemplateServer, { data: resume.data as any })
    )

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
        <body>${html}</body>
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

