import type { Metadata } from "next";
import "./globals.css";
import { AntdProvider } from "@/components/antd-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Pure Resume - 简历制作工具",
  description: "专业的在线简历制作工具，支持拖拽式编辑、实时预览和PDF导出",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* 防止 FOUC 的阻塞脚本 - 必须在最前面执行 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 立即设置主题，避免闪烁
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
                // 添加 loading 类，允许骨架屏显示，但隐藏主要内容
                document.documentElement.classList.add('page-loading');
              })();
            `,
          }}
        />
        {/* 预连接 Google Fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* 加载 Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* 关键 CSS 内联 - 确保基础样式立即应用 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html.page-loading body {
                opacity: 0;
                transition: opacity 0.2s ease-in;
              }
              html.loaded body {
                opacity: 1;
              }
              /* 允许加载状态和骨架屏立即显示 */
              html.page-loading body > div:first-child {
                opacity: 1 !important;
              }
              body { 
                background-color: oklch(0.145 0 0);
                color: oklch(0.985 0 0);
                margin: 0;
                padding: 0;
              }
            `,
          }}
        />
      </head>
      <body
        className={`antialiased`}
        suppressHydrationWarning
      >
        {/* DOM 加载完成后显示内容 - 延迟很短时间以允许骨架屏显示 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function showContent() {
                  document.documentElement.classList.remove('page-loading');
                  document.documentElement.classList.add('loaded');
                }
                // 延迟一小段时间，确保骨架屏能够显示
                function ready() {
                  if (document.readyState === 'complete') {
                    // 给一点时间让骨架屏渲染
                    setTimeout(function() {
                      requestAnimationFrame(function() {
                        requestAnimationFrame(showContent);
                      });
                    }, 50);
                  } else {
                    window.addEventListener('load', function() {
                      setTimeout(function() {
                        requestAnimationFrame(function() {
                          requestAnimationFrame(showContent);
                        });
                      }, 50);
                    });
                  }
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', ready);
                } else {
                  ready();
                }
              })();
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="theme"
        >
          <AntdProvider>
            {children}
          </AntdProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
