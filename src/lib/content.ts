/**
 * 课程正文加载。
 *
 * MDX 全量 eager 打包：课程数量在百篇量级以内时，换取的是 SSR 直出 + 站内秒开。
 * 若日后正文体量变大，改成 lazy glob + React.lazy 即可（届时需要接受首屏 loading）。
 */
import type { ComponentType } from 'react'

type MDXModule = { default: ComponentType<Record<string, unknown>> }

const modules = import.meta.glob<MDXModule>('../content/**/*.mdx', { eager: true })

export function getLessonContent(trackId: string, lessonId: string) {
  return modules[`../content/${trackId}/${lessonId}.mdx`]?.default
}

export function hasLessonContent(trackId: string, lessonId: string) {
  return Boolean(getLessonContent(trackId, lessonId))
}
