import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap'

/*
 * 与 storpath 同一个写法：白卡 + shadow-card，语气只体现在 2px 的左边条和标题色上，
 * 底色一律不染。正文里连着出现四个也不会把页面吵起来。
 * 「说明」是最低语气，边条走中性 —— 只有真正需要提高音量的三种才用语义色。
 */
const TONE: Record<Tone, { label: string; edge: string; head: string; icon: string }> = {
  note: {
    label: '说明',
    edge: 'bg-line-strong',
    head: 'text-body',
    icon: 'i',
  },
  tip: {
    label: '实践建议',
    edge: 'bg-brand-600',
    head: 'text-brand-700',
    icon: '✓',
  },
  warn: {
    label: '注意',
    edge: 'bg-warn',
    head: 'text-warn-deep',
    icon: '!',
  },
  trap: {
    label: '新人常踩的坑',
    edge: 'bg-danger',
    head: 'text-danger-deep',
    icon: '×',
  },
}

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: Tone
  title?: string
  children: ReactNode
}) {
  const tone = TONE[type]
  return (
    <div className="bg-canvas shadow-card my-6 flex overflow-hidden rounded-md text-sm">
      <span className={`w-0.5 shrink-0 ${tone.edge}`} />
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className={`mb-1.5 flex items-center gap-2 ${tone.head}`}>
          <span className="bg-soft-2 inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px]">
            {tone.icon}
          </span>
          <span className="font-medium">{title ?? tone.label}</span>
        </div>
        <div className="text-body [&>*+*]:mt-2">{children}</div>
      </div>
    </div>
  )
}
