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
    <div className="space-y-10 sm:space-y-14">
      <section>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.trackCount} stages · {roles.length} tracks
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">选一条路线</h1>
        <p className="text-body mt-3 max-w-3xl text-[15px] leading-relaxed sm:text-lg sm:leading-relaxed">
          {stats.lessonCount} 节课不必都学。挑一个和你当前岗位最近的身份，
          下面会给出裁剪过的清单 —— 只留这个岗位真正会用到的课，并切成几段推进。
          想看全貌就切到「集群运维工程师」，那条是不做裁剪的完整主线。
        </p>
      </section>

      <section>
        <div className="eyebrow">你的身份</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {roles.map((role) => {
            const active = role.id === path.role.id
            return (
              <Link
                key={role.id}
                to="/"
                search={{ role: role.id }}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-hairline bg-canvas hover:border-hairline-strong'
                }`}
              >
                <div
                  className={`text-sm font-medium ${active ? 'text-brand-700' : 'text-ink'}`}
                >
                  {role.title}
                </div>
                <div className="text-mute mt-0.5 text-[11px]">{role.alias}</div>
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
    <div className="border-hairline bg-canvas shadow-card mt-6 rounded-xl border px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-ink text-base font-semibold tracking-tight">{role.tagline}</span>
        <span className="text-mute font-mono text-[11px]">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="text-body mt-2 text-sm leading-relaxed">{role.desc}</p>
      <ul className="mt-4 space-y-1.5">
        {role.outcomes.map((outcome) => (
          <li key={outcome} className="text-body flex gap-2.5 text-sm leading-relaxed">
            <span className="text-brand-500 mt-px shrink-0">✓</span>
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
      <div className="bg-canvas-soft-2 mt-5 h-1 overflow-hidden rounded-full">
        <div
          className="bg-brand-500 h-full rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {nextUp && (
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          search={{ role: role.id }}
          className="bg-ink mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-85"
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
      <div className="mt-8 space-y-6">
        {path.stages.map(({ stage, items, minutes }) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-ink text-sm font-semibold">{stage.title}</h3>
              <span className="text-mute font-mono text-[11px]">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="text-mute mt-1 text-xs leading-relaxed">{stage.hint}</p>
            <ol className="border-hairline divide-hairline bg-canvas shadow-card mt-2.5 divide-y overflow-hidden rounded-xl border">
              {items.map((item) => (
                <li key={item.key}>
                  <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="text-mute mt-6 text-xs leading-relaxed">
        岗位路线是挑着学的，没排进这条线的课不会消失 —— 切到「集群运维工程师」就是按 L0–L4 通读的
        全部 {stats.lessonCount} 节。三条路线共用同一份进度。
      </p>
    </>
  )
}

/** 完整主线：按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <div className="mt-8 space-y-4">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <article
            key={track.id}
            className="border-hairline bg-canvas shadow-card overflow-hidden rounded-xl border"
          >
            <header className="border-hairline flex items-start gap-3 border-b px-4 py-3.5 sm:px-5">
              <span
                className={`shrink-0 rounded-md px-2 py-1 font-mono text-[11px] font-medium ${track.accent.chip}`}
              >
                {track.level}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    to="/tracks/$trackId"
                    params={{ trackId: track.id }}
                    className="hover:text-brand-600 font-semibold tracking-tight transition"
                  >
                    {track.title}
                  </Link>
                  <span className="text-mute text-[11px]">{track.subtitle}</span>
                </div>
                <p className="text-body mt-1 text-xs leading-relaxed">{track.goal}</p>
              </div>
              <span className="text-mute shrink-0 font-mono text-xs">
                {trackDone}/{track.lessons.length}
              </span>
            </header>

            <ol className="divide-hairline divide-y">
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                const done = doneSet.has(key)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: MAINLINE_ROLE_ID }}
                      className="hover:bg-canvas-soft flex items-center gap-3 px-4 py-2.5 transition sm:px-5"
                    >
                      <Marker done={done}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate text-sm">{lesson.title}</span>
                        <span className="text-mute block truncate text-xs">{lesson.summary}</span>
                      </span>
                      <KindBadge kind={lesson.kind} />
                      <span className="text-mute shrink-0 font-mono text-[11px]">
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
      className="hover:bg-canvas-soft flex items-center gap-3 px-4 py-2.5 transition"
    >
      <Marker done={done}>{item.index}</Marker>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${track.accent.chip}`}
      >
        {track.level}
      </span>
      <span className="text-ink min-w-0 flex-1 truncate text-sm">{lesson.title}</span>
      <KindBadge kind={lesson.kind} />
      <span className="text-mute shrink-0 font-mono text-[11px]">{lesson.minutes} 分</span>
    </Link>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        done ? 'bg-emerald-500 text-white' : 'bg-canvas-soft-2 text-mute'
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
    <span
      className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline ${KIND_STYLE[kind]}`}
    >
      {KIND_LABEL[kind]}
    </span>
  )
}
