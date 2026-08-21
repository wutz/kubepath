import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap'

/*
 * 四种语气各占一个语义色（说明=品牌蓝、建议=绿、注意=琥珀、坑=红），
 * 但底色只到 50、边框只到 100 —— 正文里连着出现几个也不至于把页面吵起来。
 */
const TONE: Record<Tone, { label: string; box: string; head: string; badge: string; icon: string }> =
  {
    note: {
      label: '说明',
      box: 'border-brand-100 bg-brand-50/70',
      head: 'text-brand-700',
      badge: 'bg-brand-500',
      icon: 'i',
    },
    tip: {
      label: '实践建议',
      box: 'border-emerald-100 bg-emerald-50/70',
      head: 'text-emerald-700',
      badge: 'bg-emerald-500',
      icon: '✓',
    },
    warn: {
      label: '注意',
      box: 'border-amber-100 bg-amber-50/70',
      head: 'text-amber-700',
      badge: 'bg-amber-500',
      icon: '!',
    },
    trap: {
      label: '新人常踩的坑',
      box: 'border-rose-100 bg-rose-50/70',
      head: 'text-rose-700',
      badge: 'bg-rose-500',
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
    <div className={`my-5 rounded-lg border px-4 py-3.5 text-sm ${tone.box}`}>
      <div className={`mb-1.5 flex items-center gap-2 text-[13px] font-medium ${tone.head}`}>
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px] leading-none text-white ${tone.badge}`}
        >
          {tone.icon}
        </span>
        {title ?? tone.label}
      </div>
      <div className="text-body [&>*+*]:mt-2">{children}</div>
    </div>
  )
}
