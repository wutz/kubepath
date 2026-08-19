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
    <section className="my-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
          检查点
        </span>
        <span className="text-xs text-gray-400">{multi ? '多选' : '单选'}</span>
      </header>

      <div className="px-4 py-4">
        <p className="mb-3 font-medium text-gray-900">{question}</p>

        <ul className="space-y-2">
          {options.map((option, index) => {
            const chosen = picked.includes(index)
            const reveal = submitted
            let cls = 'border-gray-200 hover:border-brand-500 hover:bg-brand-50'
            if (chosen && !reveal) cls = 'border-brand-500 bg-brand-50'
            if (reveal && option.correct) cls = 'border-emerald-400 bg-emerald-50'
            if (reveal && chosen && !option.correct) cls = 'border-rose-400 bg-rose-50'

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
                  <span className="mr-2 font-mono text-xs text-gray-400">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-800">{option.text}</span>
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
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            提交
          </button>
        ) : (
          <div className="mt-4">
            <div
              className={`rounded-lg px-3 py-2.5 text-sm ${
                isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              <strong>{isCorrect ? '答对了。' : '还不对。'}</strong>
              {explain ? <div className="mt-1 text-gray-700">{explain}</div> : null}
            </div>
            {!isCorrect && (
              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
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
