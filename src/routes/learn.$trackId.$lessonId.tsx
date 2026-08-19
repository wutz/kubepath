import { MDXProvider } from '@mdx-js/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, getFlatNeighbors, getLesson, lessonKey } from '#/lib/curriculum'
import { getLessonContent } from '#/lib/content'
import { getRole, roleNav } from '#/lib/roles'
import { setLessonDone, useProgress } from '#/lib/progress'
import { LessonKeyContext } from '#/components/lesson-context'
import { mdxComponents } from '#/components/mdx-components'

export const Route = createFileRoute('/learn/$trackId/$lessonId')({
  validateSearch: (search: Record<string, unknown>): { role?: string } => {
    const role = typeof search.role === 'string' ? search.role : undefined
    return getRole(role) ? { role } : {}
  },
  component: LessonPage,
})

function LessonPage() {
  const { trackId, lessonId } = Route.useParams()
  const { role: roleId } = Route.useSearch()
  const found = getLesson(trackId, lessonId)
  const progress = useProgress()

  if (!found) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-gray-500">
          没有这节课：{trackId}/{lessonId}
        </p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          返回学习路径
        </Link>
      </div>
    )
  }

  const { track, lesson } = found
  const key = lessonKey(track.id, lesson.id)
  const Content = getLessonContent(track.id, lesson.id)
  const done = progress.done.includes(key)
  const passedCheckpoints = progress.quiz.filter((q) => q.startsWith(`${key}#`)).length

  /* 带 ?role= 进来就是"路线模式"：前后课按路线顺序走，而不是按 L0→L4 的全局顺序 */
  const nav = roleNav(roleId, key)
  const inPath = nav?.current !== undefined
  const search = inPath ? { role: roleId } : {}
  const flat = getFlatNeighbors(track.id, lesson.id)
  const prev = inPath ? nav?.prev : flat.prev
  const next = inPath ? nav?.next : flat.next

  return (
    <div className="lg:grid lg:grid-cols-[1fr_15rem] lg:gap-8">
      <article className="min-w-0">
        <nav className="text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-700">
            学习路径
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            to="/tracks/$trackId"
            params={{ trackId: track.id }}
            className="hover:text-gray-700"
          >
            {track.level} {track.title}
          </Link>
        </nav>

        <RoleBanner nav={nav} track={track} lesson={lesson} />

        <header className="mt-3 border-b border-gray-200 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
              {KIND_LABEL[lesson.kind]}
            </span>
            <span className="text-xs text-gray-400">预计 {lesson.minutes} 分钟</span>
            {passedCheckpoints > 0 && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-700">
                检查点通过 {passedCheckpoints}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{lesson.summary}</p>
        </header>

        <section className={`mt-6 rounded-xl border px-4 py-4 sm:px-5 ${track.accent.border} ${track.accent.bg}`}>
          <h2 className={`text-sm font-semibold ${track.accent.text}`}>学完这节你能做到</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${track.accent.dot}`} />
                {objective}
              </li>
            ))}
          </ul>
        </section>

        <LessonKeyContext.Provider value={key}>
          <div className="lesson-body mt-8">
            {Content ? (
              <MDXProvider components={mdxComponents}>
                <Content />
              </MDXProvider>
            ) : (
              <OutlinePlaceholder outline={lesson.outline} />
            )}
          </div>
        </LessonKeyContext.Provider>

        {lesson.refs && lesson.refs.length > 0 && (
          <section className="mt-10 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-gray-900">延伸资料</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {lesson.refs.map((ref) => (
                <li key={ref.label + (ref.path ?? ref.href ?? '')} className="flex gap-2">
                  <span className="text-gray-300">·</span>
                  {ref.href ? (
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      {ref.label} ↗
                    </a>
                  ) : (
                    <span className="text-gray-600">
                      {ref.label}
                      {ref.path && (
                        <code className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                          {ref.path}
                        </code>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setLessonDone(key, !done)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              done
                ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {done ? '✓ 已标记完成（点击取消）' : '标记为已完成'}
          </button>
          {next ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: next.track.id, lessonId: next.lesson.id }}
              search={search}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              下一课：{next.lesson.title} →
            </Link>
          ) : (
            inPath && (
              <span className="text-sm text-gray-500">
                这是「{nav?.path.role.title}」路线的最后一节 🎉
              </span>
            )
          )}
        </div>

        <nav className="mt-6 flex justify-between text-sm">
          {prev ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: prev.track.id, lessonId: prev.lesson.id }}
              search={search}
              className="text-gray-500 hover:text-brand-600"
            >
              ← {prev.lesson.title}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <aside className="mt-10 lg:mt-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white px-4 py-4">
          {nav && inPath ? (
            <>
              <div className="text-xs font-semibold text-gray-500">{nav.path.role.title}</div>
              <div className="mt-0.5 text-[11px] text-gray-400">
                第 {nav.current?.index} / {nav.path.lessonCount} 节
              </div>
              <ol className="mt-2 space-y-2.5 text-sm">
                {nav.path.stages.map(({ stage, items }) => (
                  <li key={stage.title}>
                    <div className="px-2 text-[11px] font-semibold tracking-wide text-gray-400">
                      {stage.title}
                    </div>
                    <ol className="mt-1 space-y-0.5">
                      {items.map((item) => (
                        <li key={item.key}>
                          <SidebarLink
                            trackId={item.track.id}
                            lessonId={item.lesson.id}
                            title={item.lesson.title}
                            level={item.track.level}
                            levelClass={`${item.track.accent.bg} ${item.track.accent.text}`}
                            search={search}
                            active={item.key === key}
                            done={progress.done.includes(item.key)}
                          />
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold text-gray-500">
                {track.level} · {track.title}
              </div>
              <ol className="mt-2 space-y-0.5 text-sm">
                {track.lessons.map((item) => (
                  <li key={item.id}>
                    <SidebarLink
                      trackId={track.id}
                      lessonId={item.id}
                      title={item.title}
                      search={{}}
                      active={item.id === lesson.id}
                      done={progress.done.includes(lessonKey(track.id, item.id))}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

/** 路线模式的提示条：这是第几节、属于哪一段，以及退出路线的出口 */
function RoleBanner({
  nav,
  track,
  lesson,
}: {
  nav: ReturnType<typeof roleNav>
  track: { id: string }
  lesson: { id: string }
}) {
  if (!nav) return null

  // 带了 ?role= 但这节课不在那条路线里：说清楚，并给一条回去的路
  if (!nav.current) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs">
        <span className="text-amber-800">这一节没排进「{nav.path.role.title}」路线</span>
        <Link
          to="/"
          search={{ role: nav.path.role.id }}
          className="ml-auto text-amber-700 underline hover:text-amber-900"
        >
          回到路线 →
        </Link>
      </div>
    )
  }

  const percent = Math.round((nav.current.index / nav.path.lessonCount) * 100)

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-semibold text-brand-700">{nav.path.role.title} 路线</span>
        <span className="text-gray-500">
          第 {nav.current.index} / {nav.path.lessonCount} 节
          {nav.stage && ` · ${nav.stage.title}`}
        </span>
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: track.id, lessonId: lesson.id }}
          search={{}}
          className="ml-auto text-gray-400 hover:text-gray-700"
        >
          退出路线
        </Link>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/80">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function SidebarLink({
  trackId,
  lessonId,
  title,
  level,
  levelClass,
  search,
  active,
  done,
}: {
  trackId: string
  lessonId: string
  title: string
  level?: string
  levelClass?: string
  search: { role?: string }
  active: boolean
  done: boolean
}) {
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId, lessonId }}
      search={search}
      className={`block rounded-lg px-2 py-1.5 leading-snug transition ${
        active ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className={`mr-1.5 text-xs ${done ? 'text-emerald-500' : 'text-gray-300'}`}>
        {done ? '✓' : '○'}
      </span>
      {level && (
        <span className={`mr-1 rounded px-1 py-0.5 text-[10px] ${levelClass}`}>{level}</span>
      )}
      {title}
    </Link>
  )
}

function OutlinePlaceholder({ outline }: { outline: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-5">
      <div className="flex items-center gap-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          正文待编写
        </span>
        <span className="text-xs text-gray-400">以下是本节已定稿的小节大纲</span>
      </div>
      <ol className="mt-4 space-y-2">
        {outline.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-gray-700">
            <span className="w-5 shrink-0 text-right font-mono text-xs text-gray-400">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
