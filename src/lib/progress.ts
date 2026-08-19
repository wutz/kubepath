/**
 * 学习进度 —— 存在浏览器 localStorage，无账号体系。
 * 用 useSyncExternalStore 保证 SSR 时返回稳定的空状态，避免水合不一致。
 */
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'kubepath:progress:v1'

export interface ProgressState {
  /** 已完成课程，元素为 `${trackId}/${lessonId}` */
  done: string[]
  /** 已答对的检查点，元素为 `${trackId}/${lessonId}#${quizId}` */
  quiz: string[]
}

const EMPTY: ProgressState = { done: [], quiz: [] }

let cache: ProgressState | null = null
const listeners = new Set<() => void>()

function read(): ProgressState {
  if (typeof window === 'undefined') return EMPTY
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<ProgressState>) : null
    cache = {
      done: Array.isArray(parsed?.done) ? parsed.done : [],
      quiz: Array.isArray(parsed?.quiz) ? parsed.quiz : [],
    }
  } catch {
    cache = { done: [], quiz: [] }
  }
  return cache
}

function write(next: ProgressState) {
  cache = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 隐私模式下写入失败，内存态仍然可用
    }
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

function toggleIn(list: string[], key: string, on: boolean) {
  const has = list.includes(key)
  if (on && !has) return [...list, key]
  if (!on && has) return list.filter((k) => k !== key)
  return list
}

export function setLessonDone(key: string, done: boolean) {
  const state = read()
  write({ ...state, done: toggleIn(state.done, key, done) })
}

export function setQuizPassed(key: string, passed: boolean) {
  const state = read()
  write({ ...state, quiz: toggleIn(state.quiz, key, passed) })
}

export function resetProgress() {
  write({ done: [], quiz: [] })
}
