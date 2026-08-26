import { MDXProvider } from '@mdx-js/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  KIND_LABEL,
  KIND_STYLE,
  allLessons,
  getFlatNeighbors,
  getLesson,
  lessonKey,
  stats,
} from '#/lib/curriculum'
import { getLessonContent } from '#/lib/content'
import { setLessonDone, useProgress } from '#/lib/progress'
import { LessonKeyContext } from '#/components/lesson-context'
import { mdxComponents } from '#/components/mdx-components'

export const Route = createFileRoute('/learn/$trackId/$lessonId')({
  component: LessonPage,
})

function LessonPage() {
  const { trackId, lessonId } = Route.useParams()
  const found = getLesson(trackId, lessonId)
  const progress = useProgress()

  if (!found) {
    return (
      <div className="bg-canvas shadow-card rounded-md px-6 py-12 text-center">
        <p className="text-mute text-sm">
          没有这节课：{trackId}/{lessonId}
        </p>
        <Link to="/" className="text-brand-600 mt-3 inline-block text-sm hover:underline">
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

  /* 只有一条主线：上一课 / 下一课按 L0→L4 的全局顺序走，跨阶段也连得上 */
  const { prev, next } = getFlatNeighbors(track.id, lesson.id)
  const position =
    allLessons.findIndex((item) => item.track.id === track.id && item.lesson.id === lesson.id) + 1

  return (
    <div className="lg:grid lg:grid-cols-[1fr_16rem] lg:gap-10">
      <article className="min-w-0">
        <nav className="text-mute font-mono text-xs">
          <Link to="/" className="hover:text-ink transition">
            学习路径
          </Link>
          <span className="text-line-strong mx-1.5">/</span>
          <Link
            to="/tracks/$trackId"
            params={{ trackId: track.id }}
            className="hover:text-ink transition"
          >
            {track.level} {track.title}
          </Link>
        </nav>

        <MainlineBanner position={position} />

        <header className="border-line mt-4 border-b pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-xs px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
              {KIND_LABEL[lesson.kind]}
            </span>
            <span className="text-mute font-mono text-[11px]">预计 {lesson.minutes} 分钟</span>
            {passedCheckpoints > 0 && (
              <span className="rounded-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 text-[11px]">
                检查点通过 {passedCheckpoints}
              </span>
            )}
          </div>
          <h1 className="display-xl mt-3">{lesson.title}</h1>
          <p className="text-body mt-3 text-[17px] leading-relaxed">{lesson.summary}</p>
        </header>

        <section className="bg-canvas shadow-card mt-6 rounded-md px-5 py-4">
          <h2 className="eyebrow">学完这节你能做到</h2>
          <ul className="text-body mt-2.5 space-y-1.5 text-sm leading-relaxed">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2.5">
                <span className="bg-line-strong mt-2 h-1 w-1 shrink-0 rounded-full" />
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
          <section className="bg-canvas shadow-card mt-10 rounded-md px-5 py-4">
            <h2 className="eyebrow">延伸资料</h2>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              {lesson.refs.map((ref) => (
                <li key={ref.label + (ref.path ?? ref.href ?? '')} className="flex gap-2.5">
                  <span className="bg-line-strong mt-2 h-1 w-1 shrink-0 rounded-full" />
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
                    <span className="text-body">
                      {ref.label}
                      {ref.path && (
                        <code className="rounded-xs bg-soft-2 text-ink ml-1.5 px-1.5 py-0.5 font-mono text-xs">
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

        <div className="border-line mt-10 flex flex-wrap items-center gap-3 border-t pt-6">
          <button
            type="button"
            onClick={() => setLessonDone(key, !done)}
            className={`rounded-sm px-4 py-2.5 text-sm font-medium transition ${
              done
                ? 'bg-canvas text-ink shadow-card hover:shadow-float'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}
          >
            {done ? '✓ 已标记完成（点击取消）' : '标记为已完成'}
          </button>
          {next ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: next.track.id, lessonId: next.lesson.id }}
              className="bg-canvas text-ink shadow-card hover:shadow-float rounded-sm px-4 py-2.5 text-sm font-medium transition"
            >
              下一课：{next.lesson.title} →
            </Link>
          ) : (
            <span className="text-mute text-sm">这是整条主线的最后一节 🎉</span>
          )}
        </div>

        <nav className="mt-6 flex justify-between text-sm">
          {prev ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: prev.track.id, lessonId: prev.lesson.id }}
              className="text-mute hover:text-ink transition"
            >
              ← {prev.lesson.title}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <aside className="mt-12 lg:mt-0">
        <div className="bg-canvas shadow-card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-md px-3 py-4">
          <div className="eyebrow px-1.5">
            {track.level} · {track.title}
          </div>
          <ol className="mt-3 space-y-0.5 text-sm">
            {track.lessons.map((item) => (
              <li key={item.id}>
                <SidebarLink
                  trackId={track.id}
                  lessonId={item.id}
                  title={item.title}
                  active={item.id === lesson.id}
                  done={progress.done.includes(lessonKey(track.id, item.id))}
                />
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  )
}

/** 主线提示条：这是整条路线的第几节 */
function MainlineBanner({ position }: { position: number }) {
  const percent = Math.round((position / stats.lessonCount) * 100)

  return (
    <div className="bg-canvas shadow-card mt-4 rounded-md px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-ink font-medium">学习主线</span>
        <span className="text-mute font-mono text-[11px]">
          第 {position} / {stats.lessonCount} 节
        </span>
      </div>
      <div className="bg-soft-2 mt-2 h-1 overflow-hidden rounded-full">
        <div className="bg-brand-600 h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function SidebarLink({
  trackId,
  lessonId,
  title,
  active,
  done,
}: {
  trackId: string
  lessonId: string
  title: string
  active: boolean
  done: boolean
}) {
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId, lessonId }}
      /* 选中态用左边缘指示条，与首页的身份卡同一个表达 */
      className={`block rounded-r-sm border-l-2 py-1.5 pr-2 pl-2 leading-snug transition ${
        active
          ? 'border-brand-600 bg-soft-2 text-ink font-medium'
          : 'text-body hover:bg-soft border-transparent'
      }`}
    >
      <span className={`mr-1.5 font-mono text-[10px] ${done ? 'text-brand-600' : 'text-mute'}`}>
        {done ? '✓' : '○'}
      </span>
      {title}
    </Link>
  )
}

function OutlinePlaceholder({ outline }: { outline: string[] }) {
  return (
    <div className="border-line-strong bg-canvas rounded-md border border-dashed px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-xs bg-soft-2 text-body px-2 py-0.5 text-xs">正文待编写</span>
        <span className="text-mute text-xs">以下是本节已定稿的小节大纲</span>
      </div>
      <ol className="mt-4 space-y-2">
        {outline.map((item, index) => (
          <li key={item} className="text-body flex gap-3 text-sm">
            <span className="text-mute w-5 shrink-0 text-right font-mono text-xs">{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
