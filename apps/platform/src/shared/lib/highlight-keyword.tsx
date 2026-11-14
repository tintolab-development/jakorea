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

/** 검색어를 공백 단위 토큰으로 나눈다(빈 토큰·중복 제거) */
export function splitKeywordTokens(query: string): string[] {
  const tokens = query.split(/\s+/).filter(Boolean)
  return [...new Set(tokens)]
}

/**
 * 검색어를 공백 단위 토큰으로 나눠, 텍스트에서 일치하는 토큰마다 강조한다(대소문자 무시).
 * 긴 토큰을 먼저 맞춰 짧은 토큰이 긴 토큰 일부만 강조하지 않게 한다.
 */
export function highlightKeywordTokens(
  text: string,
  query: string,
  hitClassName: string,
): ReactNode {
  const tokens = splitKeywordTokens(query)
  if (tokens.length === 0) return text

  const lowerTokens = new Set(tokens.map(token => token.toLowerCase()))
  const pattern = [...tokens]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'))

  return parts.map((part, index) =>
    lowerTokens.has(part.toLowerCase()) ? (
      <span key={`hit-${index}-${part}`} className={hitClassName}>
        {part}
      </span>
    ) : (
      <Fragment key={`text-${index}-${part}`}>{part}</Fragment>
    ),
  )
}
