import { useEffect, useMemo, useRef, useState } from 'react'
import { useLessonKey } from './lesson-context'
import { setQuizPassed } from '#/lib/progress'

export interface TerminalCommand {
  /** 标准写法，也是 hint 里展示的形式 */
  cmd: string
  /** 等价写法 */
  aliases?: string[]
  output: string
  /** 填了就是一个闯关目标，按数组顺序编号 */
  goal?: string
  /** 目标提示，输入 hint 时按顺序给出 */
  hint?: string
}

interface Line {
  kind: 'input' | 'output' | 'system'
  text: string
}

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')

/**
 * 命令行演练器。
 * 不是真终端：所有输出都是预置的固定文本，用来练"看到什么该想什么"，
 * 而不是练打字。真机操作在 lab 类课程里做。
 */
export function Terminal({
  id,
  host = 'root@mn-10-128-0-1',
  cwd = '~',
  intro,
  commands,
}: {
  id: string
  host?: string
  cwd?: string
  intro?: string
  commands: TerminalCommand[]
}) {
  const lessonKey = useLessonKey()
  const goals = useMemo(() => commands.filter((c) => c.goal), [commands])
  const prompt = `[${host} ${cwd}]#`

  const [lines, setLines] = useState<Line[]>(() =>
    intro ? [{ kind: 'system', text: intro }] : [],
  )
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [doneGoals, setDoneGoals] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const allDone = goals.length > 0 && doneGoals.length === goals.length

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  useEffect(() => {
    if (allDone) setQuizPassed(`${lessonKey}#${id}`, true)
  }, [allDone, lessonKey, id])

  function push(...next: Line[]) {
    setLines((prev) => [...prev, ...next])
  }

  function run(raw: string) {
    const input = normalize(raw)
    if (!input) return

    setHistory((prev) => [...prev, input])
    setHistoryIndex(-1)
    push({ kind: 'input', text: input })

    if (input === 'clear') {
      setLines([])
      return
    }

    if (input === 'help') {
      push({
        kind: 'system',
        text: [
          '演练内置命令：',
          '  help   显示这段说明',
          '  goals  查看本次演练的目标',
          '  hint   给出当前目标的提示',
          '  clear  清屏',
          '其余命令请按真实排查思路自己敲。',
        ].join('\n'),
      })
      return
    }

    if (input === 'goals') {
      push({
        kind: 'system',
        text: goals
          .map((g, i) => `  [${doneGoals.includes(g.cmd) ? '✓' : ' '}] ${i + 1}. ${g.goal}`)
          .join('\n'),
      })
      return
    }

    if (input === 'hint') {
      const pending = goals.find((g) => !doneGoals.includes(g.cmd))
      push({
        kind: 'system',
        text: pending
          ? `提示：${pending.hint ?? pending.goal}\n可以试试 \`${pending.cmd}\``
          : '所有目标都完成了。',
      })
      return
    }

    const hit = commands.find(
      (c) => normalize(c.cmd) === input || c.aliases?.some((a) => normalize(a) === input),
    )

    if (!hit) {
      push({
        kind: 'output',
        text: `-bash: ${input.split(' ')[0]}: 本次演练没有预置这条命令的输出（输入 hint 看提示）`,
      })
      return
    }

    push({ kind: 'output', text: hit.output })

    if (hit.goal && !doneGoals.includes(hit.cmd)) {
      const nextDone = [...doneGoals, hit.cmd]
      setDoneGoals(nextDone)
      push({ kind: 'system', text: `✓ 目标达成：${hit.goal}` })
      if (nextDone.length === goals.length) {
        push({ kind: 'system', text: '🎉 全部目标完成，这一关过了。' })
      }
    }
  }

  return (
    /* 深色面用 DESIGN.md 的 ink #171717（code-editor-mockup），内部分层靠白色低透明度叠加 */
    <section className="bg-ink shadow-card-lg my-6 overflow-hidden rounded-lg">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="ml-2 font-mono text-xs text-white/50">{host}</span>
        </div>
        <span className="font-mono text-xs text-white/40">
          目标 {doneGoals.length}/{goals.length}
        </span>
      </header>

      {goals.length > 0 && (
        <ol className="border-b border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/60">
          {goals.map((g, i) => {
            const done = doneGoals.includes(g.cmd)
            return (
              <li key={g.cmd} className="flex items-start gap-2 py-0.5">
                <span className={done ? 'text-emerald-400' : 'font-mono text-white/40'}>
                  {done ? '✓' : `${i + 1}.`}
                </span>
                <span className={done ? 'text-white/35 line-through' : ''}>{g.goal}</span>
              </li>
            )
          })}
        </ol>
      )}

      {/*
        输出按列对齐是这套演练的重点（kubectl get pod -o wide、df -h 都靠对齐读），
        所以窄屏下不折行，改成盒子内部横向滚动。
      */}
      <div
        ref={scrollRef}
        className="max-h-96 overflow-auto overscroll-contain px-4 py-3 font-mono text-[13px] leading-relaxed"
        onClick={() => document.getElementById(`term-${id}`)?.focus()}
      >
        {lines.map((line, i) => (
          <pre
            key={i}
            className={`whitespace-pre ${
              line.kind === 'input'
                ? 'text-emerald-400'
                : line.kind === 'system'
                  ? 'text-brand-200'
                  : 'text-white/70'
            }`}
          >
            {line.kind === 'input' ? `${prompt} ${line.text}` : line.text}
          </pre>
        ))}

        <div className="sticky left-0 flex items-center gap-2 text-emerald-400">
          <span className="shrink-0">{prompt}</span>
          <input
            id={`term-${id}`}
            value={value}
            spellCheck={false}
            autoComplete="off"
            // 手机输入法默认会首字母大写、自动纠错，敲出来的命令一律匹配不上
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="go"
            className="w-full min-w-32 bg-transparent text-white outline-none"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                run(value)
                setValue('')
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (!history.length) return
                const next = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1)
                setHistoryIndex(next)
                setValue(history[next])
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (historyIndex < 0) return
                const next = historyIndex + 1
                if (next >= history.length) {
                  setHistoryIndex(-1)
                  setValue('')
                } else {
                  setHistoryIndex(next)
                  setValue(history[next])
                }
              }
            }}
          />
        </div>
      </div>

      <footer className="border-t border-white/10 bg-white/5 px-4 py-2 font-mono text-[11px] text-white/40">
        help 查看用法 · goals 看目标 · hint 要提示 · ↑↓ 翻历史
      </footer>
    </section>
  )
}
