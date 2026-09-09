import type { ReactNode } from 'react'
import { findMailVariableRanges } from '@/features/notifications/model/mail-template/insert-variable'

/** `#{변수}` 구간을 mint span으로 감싼 ReactNode (메일 칩과 동일 룩) */
export function renderNotificationVariableText(
  text: string,
  options?: { className?: string; emptyFallback?: ReactNode }
): ReactNode {
  const className = options?.className ?? 'notification-variable-token'
  if (!text) return options?.emptyFallback ?? null

  const ranges = findMailVariableRanges(text)
  if (ranges.length === 0) return text

  const nodes: ReactNode[] = []
  let cursor = 0
  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index]
    if (!range) continue
    if (cursor < range.from) {
      nodes.push(text.slice(cursor, range.from))
    }
    nodes.push(
      <span key={`var-${range.from}-${range.to}`} className={className}>
        {text.slice(range.from, range.to)}
      </span>
    )
    cursor = range.to
  }
  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }
  return nodes
}
