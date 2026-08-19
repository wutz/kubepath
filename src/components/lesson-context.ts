import { createContext, useContext } from 'react'

/** 当前课程的 `${trackId}/${lessonId}`，交互组件用它拼进度 key */
export const LessonKeyContext = createContext<string>('unknown')

export function useLessonKey() {
  return useContext(LessonKeyContext)
}
