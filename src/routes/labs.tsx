import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_STYLE, allLessons, lessonKey, type LessonKind } from '#/lib/curriculum'
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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">实验与闯关</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          知识点看过就忘，手上做过才记得住。这里把全部动手环节汇总在一起，
          你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        return (
          <section key={section.kind}>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <span className="text-sm text-gray-500">{section.desc}</span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="flex flex-col rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-brand-500 hover:shadow"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded px-1.5 py-0.5 ${track.accent.bg} ${track.accent.text}`}>
                        {track.level} {track.title}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 ${KIND_STYLE[lesson.kind]}`}>
                        {lesson.minutes} 分钟
                      </span>
                      {done && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-400">
                          仅大纲
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-gray-900">{lesson.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{lesson.summary}</p>
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
