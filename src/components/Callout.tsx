import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap'

const TONE: Record<Tone, { label: string; box: string; head: string; icon: string }> = {
  note: {
    label: '说明',
    box: 'border-sky-200 bg-sky-50',
    head: 'text-sky-800',
    icon: 'i',
  },
  tip: {
    label: '实践建议',
    box: 'border-emerald-200 bg-emerald-50',
    head: 'text-emerald-800',
    icon: '✓',
  },
  warn: {
    label: '注意',
    box: 'border-amber-200 bg-amber-50',
    head: 'text-amber-800',
    icon: '!',
  },
  trap: {
    label: '新人常踩的坑',
    box: 'border-rose-200 bg-rose-50',
    head: 'text-rose-800',
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
    <div className={`my-5 rounded-lg border px-4 py-3 text-sm ${tone.box}`}>
      <div className={`mb-1 flex items-center gap-2 font-semibold ${tone.head}`}>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-xs">
          {tone.icon}
        </span>
        {title ?? tone.label}
      </div>
      <div className="text-gray-700 [&>*+*]:mt-2">{children}</div>
    </div>
  )
}
