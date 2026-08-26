import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, allLessons, lessonKey, stats, tracks } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  const doneCount = allLessons.filter(({ track, lesson }) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length
  const percent = Math.round((doneCount / stats.lessonCount) * 100)
  const nextUp =
    allLessons.find(({ track, lesson }) => !doneSet.has(lessonKey(track.id, lesson.id))) ??
    allLessons[0]

  return (
    <div className="space-y-10">
      <section>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.trackCount} levels ·{' '}
          {Math.round(stats.totalMinutes / 60)} hours
        </div>
        <h1 className="display-2xl mt-3">一条主线，从容器走到 AI 平台。</h1>
        <p className="text-body mt-4 max-w-2xl text-[17px] leading-relaxed">
          先用 Docker 把容器与镜像吃透，再在本机的 kind 集群上摸熟 K8s 对象与调度，
          然后把集群装到真机上并逐层选型，接上观测与仓库、扛住升级与故障，
          最后走进 GPU、训练与推理的战场。{stats.lessonCount} 节课按这个顺序排好，从头走就行。
        </p>
      </section>

      <section className="bg-canvas shadow-soft rounded-lg px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="display-md">学习进度</h2>
          <span className="text-mute font-mono text-xs">
            已完成 {doneCount}/{stats.lessonCount} · 约 {Math.round(stats.totalMinutes / 60)} 小时
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="bg-soft-2 h-1 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-brand-600 h-full rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-mute font-mono text-[11px]">{percent}%</span>
        </div>
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex items-center rounded-sm px-4 py-2.5 text-sm font-medium text-white transition"
        >
          {doneCount > 0 ? '继续学习' : '从第一节开始'} · {nextUp.track.level}{' '}
          {nextUp.lesson.title}
        </Link>
      </section>

      <Catalog doneSet={doneSet} />
    </div>
  )
}

/** 全部课程：按 L0–L4 阶段通读 */
function Catalog({ doneSet }: { doneSet: Set<string> }) {
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
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      className="hover:bg-soft flex items-center gap-3 px-4 py-2.5 transition sm:px-5"
                    >
                      <Marker done={doneSet.has(key)}>{index + 1}</Marker>
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
