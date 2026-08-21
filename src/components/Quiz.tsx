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
    <section className="bg-canvas shadow-card my-6 overflow-hidden rounded-md">
      <header className="border-line flex items-center gap-2.5 border-b px-4 py-3">
        <span className="eyebrow">检查点</span>
        <span className="text-mute text-xs">{multi ? '多选' : '单选'}</span>
      </header>

      <div className="px-4 py-4">
        <p className="text-ink mb-3.5 font-medium">{question}</p>

        <ul className="space-y-2">
          {options.map((option, index) => {
            const chosen = picked.includes(index)
            const reveal = submitted
            /* 对/错沿用语义色：brand 在这里已经被"已选中"占掉了 */
            let cls = 'border-line hover:border-brand-600 hover:bg-soft'
            if (chosen && !reveal) cls = 'border-brand-600 bg-brand-50'
            if (reveal && option.correct) cls = 'border-brand-600 bg-brand-50'
            if (reveal && chosen && !option.correct) cls = 'border-danger bg-danger-soft/40'

            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  disabled={submitted}
                  className={`w-full rounded-sm border px-3 py-2.5 text-left text-sm transition ${cls} ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="text-mute mr-2 font-mono text-xs">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-ink">{option.text}</span>
                  {reveal && chosen && !option.correct && option.feedback && (
                    <span className="text-danger-deep mt-1 block text-xs">{option.feedback}</span>
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
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-soft-2 disabled:text-mute mt-4 rounded-sm px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed"
          >
            提交
          </button>
        ) : (
          <div className="mt-4">
            <div className="bg-canvas shadow-card flex overflow-hidden rounded-md text-sm">
              <span
                className={`w-0.5 shrink-0 ${isCorrect ? 'bg-brand-600' : 'bg-danger'}`}
              />
              <div className="min-w-0 flex-1 px-4 py-3">
                <strong className={`font-medium ${isCorrect ? 'text-brand-700' : 'text-danger-deep'}`}>
                  {isCorrect ? '答对了。' : '还不对。'}
                </strong>
                {explain ? <div className="text-body mt-1.5">{explain}</div> : null}
              </div>
            </div>
            {!isCorrect && (
              <button
                type="button"
                onClick={retry}
                className="bg-canvas text-ink shadow-card hover:shadow-float mt-3 rounded-sm px-4 py-2 text-sm font-medium transition"
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
