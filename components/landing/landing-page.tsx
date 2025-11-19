'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Layout, FileText, Download } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export function LandingPage() {
  const { token } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStartClick = (e: React.MouseEvent) => {
    if (!token) {
      e.preventDefault()
      toast.info('请先登录')
      router.push('/login')
    }
  }

  // 未挂载时显示加载状态，避免闪烁
  // 或者，我们可以显示一个不区分登录状态的通用版本，等挂载后再更新
  // 但为了减少布局跳动，我们可以用一个简单的加载占位符
  const renderAuthButtons = () => {
    if (!mounted) {
      return null
    }

    if (token) {
      return (
        <Link href="/resume">
          <Button>控制面板</Button>
        </Link>
      )
    }

    return (
      <>
        <Link href="/login">
          <Button variant="ghost">登录</Button>
        </Link>
        <Link href="/register">
          <Button>注册</Button>
        </Link>
      </>
    )
  }

  const renderHeroButton = () => {
    if (!mounted) {
      return null
    }

    if (token) {
      return (
        <Link href="/resume">
          <Button size="lg" className="gap-2">
            控制面板 <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      )
    }

    return (
      <Button size="lg" className="gap-2" onClick={handleStartClick}>
        开始制作 <ArrowRight className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <FileText className="h-6 w-6 text-primary" />
            <span>Resume Builder</span>
          </div>
          <nav className="flex gap-4 items-center">
            {renderAuthButtons()}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center space-y-8 px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            打造您的专业简历，<br className="hidden md:inline" />
            <span className="text-primary">只需几分钟</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            无需排版技巧，专注于您的内容。我们提供专业的模板和直观的编辑器，助您轻松获得面试机会。
          </p>
          <div className="flex justify-center gap-4">
            {renderHeroButton()}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm border">
                <Layout className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">拖拽式编辑</h3>
                <p className="text-muted-foreground">
                  模块化设计，随心所欲调整布局。所见即所得的编辑体验。
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-sm border">
                <FileText className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">实时预览</h3>
                <p className="text-muted-foreground">
                  编辑过程中实时查看简历效果，确保每一个细节都完美无缺。
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-sm border">
                <Download className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">PDF 导出</h3>
                <p className="text-muted-foreground">
                  一键导出高清 PDF 文件，适配 A4 纸张，打印效果完美。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-muted-foreground">
        <div className="container mx-auto">
          <p>&copy; 2024 Resume Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
