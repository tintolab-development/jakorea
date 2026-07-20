import { Fragment, type ReactNode } from 'react'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightKeyword(text: string, query: string, hitClassName: string): ReactNode {
  const needle = query.trim()
  if (!needle) return text

  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))

  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <span key={`hit-${index}-${part}`} className={hitClassName}>
        {part}
      </span>
    ) : (
      <Fragment key={`text-${index}-${part}`}>{part}</Fragment>
    ),
  )
}
