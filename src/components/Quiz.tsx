import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLessonKey } from './lesson-context'
import { setQuizPassed } from '#/lib/progress'

export interface QuizOption {
  text: string
  correct?: boolean
  /** 选错时针对性的解释，比统一答案更有教学价值 */
  feedback?: string
}

/**
 * 随堂检查点。多选时必须完全选对才算通过。
 * 通过后写进 localStorage，课程页顶部的检查点计数会跟着变。
 */
export function Quiz({
  id,
  question,
  options,
  explain,
}: {
  id: string
  question: string
  options: QuizOption[]
  explain?: ReactNode
}) {
  const lessonKey = useLessonKey()
  const multi = options.filter((o) => o.correct).length > 1
  const [picked, setPicked] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)

  const correctSet = options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0)
  const isCorrect =
    submitted &&
    picked.length === correctSet.length &&
    picked.every((i) => correctSet.includes(i))

  function toggle(index: number) {
    if (submitted) return
    setPicked((prev) =>
      multi
        ? prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
        : [index],
    )
  }

  function submit() {
    if (!picked.length) return
    setSubmitted(true)
    const ok =
      picked.length === correctSet.length && picked.every((i) => correctSet.includes(i))
    if (ok) setQuizPassed(`${lessonKey}#${id}`, true)
  }

  function retry() {
    setSubmitted(false)
    setPicked([])
  }

  return (
    <section className="border-hairline bg-canvas shadow-card my-6 rounded-xl border">
      <header className="border-hairline flex items-center gap-2.5 border-b px-4 py-3">
        <span className="eyebrow">检查点</span>
        <span className="text-mute text-xs">{multi ? '多选' : '单选'}</span>
      </header>

      <div className="px-4 py-4">
        <p className="text-ink mb-3.5 font-medium">{question}</p>

        <ul className="space-y-2">
          {options.map((option, index) => {
            const chosen = picked.includes(index)
            const reveal = submitted
            let cls = 'border-hairline hover:border-brand-500 hover:bg-brand-50/50'
            if (chosen && !reveal) cls = 'border-brand-500 bg-brand-50'
            if (reveal && option.correct) cls = 'border-emerald-300 bg-emerald-50'
            if (reveal && chosen && !option.correct) cls = 'border-rose-300 bg-rose-50'

            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  disabled={submitted}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${cls} ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="text-mute mr-2 font-mono text-xs">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-ink">{option.text}</span>
                  {reveal && chosen && !option.correct && option.feedback && (
                    <span className="mt-1 block text-xs text-rose-700">{option.feedback}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!picked.length}
            className="bg-ink disabled:bg-hairline disabled:text-mute mt-4 rounded-full px-5 py-2 text-sm font-medium text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-100"
          >
            提交
          </button>
        ) : (
          <div className="mt-4">
            <div
              className={`rounded-lg border px-3.5 py-3 text-sm ${
                isCorrect
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                  : 'border-rose-100 bg-rose-50 text-rose-800'
              }`}
            >
              <strong className="font-medium">{isCorrect ? '答对了。' : '还不对。'}</strong>
              {explain ? <div className="text-body mt-1.5">{explain}</div> : null}
            </div>
            {!isCorrect && (
              <button
                type="button"
                onClick={retry}
                className="border-hairline text-ink hover:border-hairline-strong mt-3 rounded-full border px-5 py-1.5 text-sm font-medium transition"
              >
                再试一次
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
