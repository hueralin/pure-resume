import React from 'react'
import { ResumeData } from '@/types/resume'

/**
 * 动态导入 React 服务端渲染工具
 * 避免在 API 路由中直接导入 react-dom/server
 */
async function getRenderer() {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { DefaultTemplateServer } = await import('@/templates/default/server')
  return { renderToStaticMarkup, DefaultTemplateServer }
}

/**
 * 将简历数据渲染为 HTML 字符串
 * 使用 server.tsx 组件确保与预览一致
 */
export async function renderResumeToHTML(data: ResumeData): Promise<string> {
  const { renderToStaticMarkup, DefaultTemplateServer } = await getRenderer()
  return renderToStaticMarkup(React.createElement(DefaultTemplateServer, { data }))
}

