import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, lessonKey, stats, tracks } from '#/lib/curriculum'
import {
  MAINLINE_ROLE_ID,
  type PathItem,
  type RolePath,
  getRole,
  rolePath,
  roles,
} from '#/lib/roles'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { role?: string } => {
    const role = typeof search.role === 'string' ? search.role : undefined
    return getRole(role) ? { role } : {}
  },
  component: Home,
})

function Home() {
  const { role: roleParam } = Route.useSearch()
  const path = rolePath(roleParam) ?? rolePath(roles[0].id)!

  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-5 sm:px-6">
        <h1 className="text-xl font-bold">选一条路线</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          {stats.lessonCount} 节课不必都学。挑一个和你当前岗位最近的身份，
          下面会给出裁剪过的清单 —— 只留这个岗位真正会用到的课，并切成几段推进。
          想看全貌就切到「集群运维工程师」，那条是不做裁剪的完整主线。
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {roles.map((role) => {
            const active = role.id === path.role.id
            return (
              <Link
                key={role.id}
                to="/"
                search={{ role: role.id }}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition ${
                  active
                    ? 'border-brand-500 bg-white shadow-sm'
                    : 'border-transparent bg-white/50 hover:bg-white/80'
                }`}
              >
                <div
                  className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-gray-700'}`}
                >
                  {role.title}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">{role.alias}</div>
              </Link>
            )
          })}
        </div>

        <PathSummary path={path} doneSet={doneSet} />

        {path.role.layout === 'catalog' ? (
          <CatalogView doneSet={doneSet} />
        ) : (
          <StagesView path={path} doneSet={doneSet} />
        )}
      </section>
    </div>
  )
}

/** 路线简介卡：诉求一句话 + 规模 + 裁剪说明 + 产出 + 进度 + 入口 */
function PathSummary({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  const { role, items, lessonCount, minutes } = path
  const doneCount = items.filter((item) => doneSet.has(item.key)).length
  const percent = lessonCount > 0 ? Math.round((doneCount / lessonCount) * 100) : 0
  const nextUp = items.find((item) => !doneSet.has(item.key)) ?? items[0]

  return (
    <div className="mt-4 rounded-xl bg-white/70 px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{role.tagline}</span>
        <span className="text-xs text-gray-500">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{role.desc}</p>
      <ul className="mt-2.5 space-y-1">
        {role.outcomes.map((outcome) => (
          <li key={outcome} className="flex gap-2 text-xs leading-relaxed text-gray-600">
            <span className="text-brand-500">✓</span>
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {nextUp && (
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          search={{ role: role.id }}
          className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          {doneCount > 0 ? '继续这条路线' : '沿这条路线开始'} · 第 {nextUp.index} 节{' '}
          {nextUp.lesson.title}
        </Link>
      )}
    </div>
  )
}

/** 裁剪过的路线：按段列课，序号是整条路线的连续序号 */
function StagesView({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  return (
    <>
      <div className="mt-4 space-y-4">
        {path.stages.map(({ stage, items, minutes }) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="text-sm font-semibold text-gray-900">{stage.title}</h3>
              <span className="text-[11px] text-gray-400">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{stage.hint}</p>
            <ol className="mt-2 space-y-1">
              {items.map((item) => (
                <li key={item.key}>
                  <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        岗位路线是挑着学的，没排进这条线的课不会消失 —— 切到「集群运维工程师」就是按 L0–L4 通读的
        全部 {stats.lessonCount} 节。三条路线共用同一份进度。
      </p>
    </>
  )
}

/** 完整主线：按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <div className="mt-4 space-y-3">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <article
            key={track.id}
            className={`overflow-hidden rounded-xl border bg-white ${track.accent.border}`}
          >
            <header className={`flex items-start gap-3 px-4 py-3 ${track.accent.bg}`}>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold shadow-sm ${track.accent.text}`}
              >
                {track.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    to="/tracks/$trackId"
                    params={{ trackId: track.id }}
                    className="font-bold hover:underline"
                  >
                    {track.title}
                  </Link>
                  <span className="text-[11px] text-gray-500">{track.subtitle}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{track.goal}</p>
              </div>
              <div className={`shrink-0 text-sm font-bold ${track.accent.text}`}>
                {trackDone}/{track.lessons.length}
              </div>
            </header>

            <ol className="divide-y divide-gray-100">
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                const done = doneSet.has(key)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: MAINLINE_ROLE_ID }}
                      className="flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-gray-50"
                    >
                      <Marker done={done}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-gray-800">{lesson.title}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {lesson.summary}
                        </span>
                      </span>
                      <KindBadge kind={lesson.kind} />
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {lesson.minutes} 分
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </article>
        )
      })}
    </div>
  )
}

function LessonRow({
  item,
  roleId,
  done,
}: {
  item: PathItem
  roleId: string
  done: boolean
}) {
  const { track, lesson } = item
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId: track.id, lessonId: lesson.id }}
      search={{ role: roleId }}
      className="flex items-center gap-2.5 rounded-lg bg-white/70 px-3 py-2 transition hover:bg-white"
    >
      <Marker done={done}>{item.index}</Marker>
      <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] ${track.accent.bg} ${track.accent.text}`}>
        {track.level}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{lesson.title}</span>
      <KindBadge kind={lesson.kind} />
      <span className="shrink-0 text-[11px] text-gray-400">{lesson.minutes} 分</span>
    </Link>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
        done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
      }`}
    >
      {done ? '✓' : children}
    </span>
  )
}

/** 「原理」是默认形态，只给动手环节挂徽标 */
function KindBadge({ kind }: { kind: keyof typeof KIND_LABEL }) {
  if (kind === 'concept') return null
  return (
    <span className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] sm:inline ${KIND_STYLE[kind]}`}>
      {KIND_LABEL[kind]}
    </span>
  )
}
