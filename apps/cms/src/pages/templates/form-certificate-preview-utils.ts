import type { KeyboardEvent, MouseEvent } from 'react'

export function labelToGraphemes(label: string): string[] {
  return Array.from(label)
}

/** 발급일자 — 오늘 기준 년·월·일 (한국어) */
export function formatCertificateIssueDate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}년 ${m}월 ${d}일`
}

export function certificateIssueDateIso(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function splitParticipantValues(text: string, count: number): string[] {
  const lines = text.split(/\n/)
  const out = [...lines]
  while (out.length < count) out.push('')
  return out.slice(0, count)
}

export function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function stopAndSelect(fieldName: string, onRegionClick?: (fieldName: string) => void) {
  return (e: MouseEvent) => {
    e.stopPropagation()
    onRegionClick?.(fieldName)
  }
}

/** `role="button"` 영역 — 클릭·Enter·Space로 필드 선택 동기화 */
export function getRegionActivationHandlers(
  fieldName: string,
  onRegionClick?: (fieldName: string) => void
) {
  return {
    onClick: stopAndSelect(fieldName, onRegionClick),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onRegionClick?.(fieldName)
      }
    },
  }
}
