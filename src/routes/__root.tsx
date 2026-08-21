import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Kubepath — K8s 工程师成长路径' },
      {
        name: 'description',
        content:
          'Kubernetes 的在线交互式学习项目：按解决方案架构师、集群运维、存储运维三条岗位路线组织，覆盖容器底座、控制面原理、kubespray 部署运维、网络与存储接入、GPU 与 AI 负载调度。',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
      /* Geist / Geist Mono —— 与 storpath 同一份字体来源 */
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="bg-soft font-sans text-ink min-h-screen antialiased">
        {/* 顶栏固定 64px（DESIGN.md nav-bar）；styles.css 的 scroll-padding-top 跟着这个高度 */}
        <header className="border-line bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img src="/logo.svg" alt="" width={26} height={26} className="h-6.5 w-6.5 shrink-0" />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">Kubepath</span>
              <span className="border-line text-mute hidden border-l pl-2.5 text-xs sm:inline">
                K8s 工程师成长路径
              </span>
            </Link>
            <nav className="-mr-1 flex items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-soft-2 text-ink' }}
                className="text-body hover:bg-soft-2 hover:text-ink shrink-0 rounded-full px-3 py-1.5 transition"
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: 'bg-soft-2 text-ink' }}
                className="text-body hover:bg-soft-2 hover:text-ink shrink-0 rounded-full px-3 py-1.5 transition"
              >
                实验与闯关
              </Link>
              <a
                href="https://wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-body hover:bg-soft-2 hover:text-ink shrink-0 rounded-full px-3 py-1.5 transition"
              >
                wutz.dev ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Outlet />
        </main>

        <footer className="border-line bg-canvas mt-16 border-t sm:mt-24">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="eyebrow">Kubepath</div>
            <p className="text-body mt-3 max-w-3xl text-sm leading-relaxed">
              K8s 工程师成长路径，按岗位分成方案、集群运维、存储运维三条路线。内容基于
              k8s-in-action 部署手册与 Kubernetes 官方文档整理。
            </p>
            <p className="text-mute mt-2 text-xs">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
