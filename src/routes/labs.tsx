import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, allLessons, lessonKey, type LessonKind } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/labs')({
  component: LabsPage,
})

const SECTIONS: { kind: LessonKind; title: string; desc: string }[] = [
  {
    kind: 'quest',
    title: '命令行闯关',
    desc: '在模拟终端里接手一套出问题的集群，按目标一步步定位根因。',
  },
  {
    kind: 'lab',
    title: '动手实验',
    desc: '需要真实环境（虚拟机或测试集群），跟着步骤把服务跑起来。',
  },
  {
    kind: 'planner',
    title: '规划计算器',
    desc: '改参数看结果，把节点规格、可分配资源与集群规模的账算明白。',
  },
]

function LabsPage() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-10 sm:space-y-14">
      <header>
        <div className="eyebrow">Hands-on</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">实验与闯关</h1>
        <p className="text-body mt-3 max-w-3xl text-[15px] leading-relaxed sm:text-lg sm:leading-relaxed">
          知识点看过就忘，手上做过才记得住。这里把全部动手环节汇总在一起，
          你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        return (
          <section key={section.kind}>
            <h2 className="text-ink text-lg font-semibold tracking-tight">{section.title}</h2>
            <p className="text-mute mt-1 text-sm leading-relaxed">{section.desc}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="border-hairline bg-canvas shadow-card hover:shadow-card-lg hover:border-hairline-strong flex flex-col rounded-xl border px-5 py-4 transition"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono font-medium ${track.accent.chip}`}
                      >
                        {track.level} {track.title}
                      </span>
                      <span className="bg-brand-50 text-brand-700 rounded px-1.5 py-0.5 font-medium">
                        {KIND_LABEL[lesson.kind]}
                      </span>
                      <span className="text-mute font-mono">{lesson.minutes} 分钟</span>
                      {done && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && (
                        <span className="bg-canvas-soft-2 text-mute rounded px-1.5 py-0.5">
                          仅大纲
                        </span>
                      )}
                    </div>
                    <h3 className="text-ink mt-2.5 font-semibold tracking-tight">{lesson.title}</h3>
                    <p className="text-body mt-1.5 text-sm leading-relaxed">{lesson.summary}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
