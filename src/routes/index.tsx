import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  KIND_LABEL,
  KIND_STYLE,
  LEVEL_CHIP,
  lessonKey,
  stats,
  tracks,
} from '#/lib/curriculum'
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
    <div className="space-y-10">
      <section>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.trackCount} levels · {roles.length} tracks
        </div>
        <h1 className="display-2xl mt-3">选一条路线。</h1>
        <p className="text-body mt-4 max-w-2xl text-[17px] leading-relaxed">
          {stats.lessonCount} 节课不必都学。挑一个和你当前岗位最近的身份，
          下面会给出裁剪过的清单 —— 只留这个岗位真正会用到的课，并切成几段推进。
          想看全貌就切到「集群运维工程师」，那条是不做裁剪的完整主线。
        </p>
      </section>

      <section>
        {/* 选中态用左边缘指示条 —— 全站统一的"当前项"表达 */}
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map((role) => {
            const active = role.id === path.role.id
            return (
              <Link
                key={role.id}
                to="/"
                search={{ role: role.id }}
                className={`rounded-md border-l-2 px-4 py-3 text-left transition ${
                  active
                    ? 'border-brand-600 bg-canvas shadow-soft'
                    : 'border-transparent bg-soft-2 text-body hover:bg-canvas hover:shadow-card'
                }`}
              >
                <div className={`text-sm font-medium ${active ? 'text-ink' : 'text-body'}`}>
                  {role.title}
                </div>
                <div className="text-mute mt-0.5 font-mono text-[11px]">{role.alias}</div>
              </Link>
            )
          })}
        </div>

        <PathSummary path={path} doneSet={doneSet} />
      </section>

      {path.role.layout === 'catalog' ? (
        <CatalogView doneSet={doneSet} />
      ) : (
        <StagesView path={path} doneSet={doneSet} />
      )}
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
    <div className="bg-canvas shadow-soft mt-3 rounded-lg px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="display-md">{role.tagline}</h2>
        <span className="text-mute font-mono text-xs">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="text-body mt-2 max-w-2xl text-sm leading-relaxed">{role.desc}</p>
      <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {role.outcomes.map((outcome) => (
          <li key={outcome} className="text-body flex gap-2 text-sm leading-relaxed">
            <span className="bg-line-strong mt-2 h-1 w-1 shrink-0 rounded-full" />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-3">
        <div className="bg-soft-2 h-1 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-brand-600 h-full rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-mute font-mono text-[11px]">{percent}%</span>
      </div>
      {nextUp && (
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          search={{ role: role.id }}
          className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex items-center rounded-sm px-4 py-2.5 text-sm font-medium text-white transition"
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
      <section className="space-y-8">
        {path.stages.map(({ stage, items, minutes }, index) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="eyebrow">Stage {index + 1}</span>
              <h3 className="display-sm">{stage.title}</h3>
              <span className="text-mute font-mono text-[11px]">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="text-body mt-1 text-sm leading-relaxed">{stage.hint}</p>
            <ol className="divide-line bg-canvas shadow-card mt-3 divide-y overflow-hidden rounded-md">
              {items.map((item) => (
                <li key={item.key}>
                  <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
      <p className="text-mute text-xs leading-relaxed">
        岗位路线是挑着学的，没排进这条线的课不会消失 —— 切到「集群运维工程师」就是按 L0–L4 通读的
        全部 {stats.lessonCount} 节。三条路线共用同一份进度。
      </p>
    </>
  )
}

/** 完整主线：按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <section className="space-y-8">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <div key={track.id}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="eyebrow">{track.level}</span>
              <Link
                to="/tracks/$trackId"
                params={{ trackId: track.id }}
                className="display-sm hover:text-brand-600 transition"
              >
                {track.title}
              </Link>
              <span className="text-mute font-mono text-[11px]">
                {track.lessons.length} 节 · 已完成 {trackDone}/{track.lessons.length}
              </span>
            </div>
            <p className="text-body mt-1 text-sm leading-relaxed">{track.goal}</p>

            <ol className="divide-line bg-canvas shadow-card mt-3 divide-y overflow-hidden rounded-md">
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                const done = doneSet.has(key)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: MAINLINE_ROLE_ID }}
                      className="hover:bg-soft flex items-center gap-3 px-4 py-2.5 transition sm:px-5"
                    >
                      <Marker done={done}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate text-sm">{lesson.title}</span>
                        <span className="text-mute block truncate text-xs">{lesson.summary}</span>
                      </span>
                      <KindBadge kind={lesson.kind} />
                      <span className="text-mute shrink-0 font-mono text-[11px]">
                        {lesson.minutes}m
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </div>
        )
      })}
    </section>
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
      className="hover:bg-soft flex items-center gap-3 px-4 py-2.5 transition sm:px-5"
    >
      <Marker done={done}>{item.index}</Marker>
      <span className={LEVEL_CHIP}>{track.level}</span>
      <span className="text-ink min-w-0 flex-1 truncate text-sm">{lesson.title}</span>
      <KindBadge kind={lesson.kind} />
      <span className="text-mute shrink-0 font-mono text-[11px]">{lesson.minutes}m</span>
    </Link>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        done ? 'bg-brand-600 text-white' : 'bg-soft-2 text-mute'
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
    <span className={`rounded-xs hidden shrink-0 px-1.5 py-0.5 text-[10px] sm:inline ${KIND_STYLE[kind]}`}>
      {KIND_LABEL[kind]}
    </span>
  )
}
