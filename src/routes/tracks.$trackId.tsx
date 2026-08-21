import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, getTrack, lessonKey } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/tracks/$trackId')({
  component: TrackPage,
})

function TrackPage() {
  const { trackId } = Route.useParams()
  const track = getTrack(trackId)
  const progress = useProgress()

  if (!track) {
    return (
      <div className="border-hairline bg-canvas shadow-card rounded-xl border px-6 py-12 text-center">
        <p className="text-mute text-sm">没有这个阶段：{trackId}</p>
        <Link to="/" className="text-brand-600 mt-3 inline-block text-sm hover:underline">
          返回学习路径
        </Link>
      </div>
    )
  }

  const doneSet = new Set(progress.done)
  const doneCount = track.lessons.filter((lesson) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length
  const totalMinutes = track.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)

  return (
    <div className="space-y-8">
      <nav className="text-mute text-xs">
        <Link to="/" className="hover:text-ink transition">
          学习路径
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-body">
          {track.level} {track.title}
        </span>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-md px-2 py-1 font-mono text-xs font-medium ${track.accent.chip}`}
          >
            {track.level}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{track.title}</h1>
          <span className="text-mute text-sm">{track.subtitle}</span>
        </div>
        <p className="text-body mt-3 max-w-3xl leading-relaxed">{track.goal}</p>
        <div className="text-mute mt-4 flex flex-wrap gap-4 font-mono text-[11px]">
          <span>
            {track.lessons.length} 节课 · 约 {Math.round(totalMinutes / 60)} 小时
          </span>
          <span>
            已完成 {doneCount}/{track.lessons.length}
          </span>
        </div>
      </header>

      <ol className="space-y-3">
        {track.lessons.map((lesson, index) => {
          const done = doneSet.has(lessonKey(track.id, lesson.id))
          return (
            <li key={lesson.id}>
              <Link
                to="/learn/$trackId/$lessonId"
                params={{ trackId: track.id, lessonId: lesson.id }}
                className="border-hairline bg-canvas shadow-card hover:shadow-card-lg hover:border-hairline-strong block rounded-xl border px-5 py-4 transition"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${
                      done ? 'bg-emerald-500 text-white' : 'bg-canvas-soft-2 text-mute'
                    }`}
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  <h2 className="text-ink font-semibold tracking-tight">{lesson.title}</h2>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${KIND_STYLE[lesson.kind]}`}
                  >
                    {KIND_LABEL[lesson.kind]}
                  </span>
                  <span className="text-mute font-mono text-[11px]">{lesson.minutes} 分钟</span>
                  {lesson.status === 'planned' && (
                    <span className="bg-canvas-soft-2 text-mute rounded px-1.5 py-0.5 text-[11px]">
                      仅大纲
                    </span>
                  )}
                </div>

                <p className="text-body mt-2.5 text-sm leading-relaxed">{lesson.summary}</p>

                <ul className="text-mute mt-3 space-y-1 text-xs">
                  {lesson.objectives.map((objective) => (
                    <li key={objective} className="flex gap-2">
                      <span className="text-hairline-strong">→</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
