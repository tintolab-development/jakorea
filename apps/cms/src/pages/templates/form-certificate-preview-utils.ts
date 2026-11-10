import type { KeyboardEvent, MouseEvent } from 'react'

export function labelToGraphemes(label: string): string[] {
  return Array.from(label)
}

/** Asia/Seoul 달력일(년·월·일). 서버 발급 일시(UTC)와 파일명 날짜를 같은 기준으로 맞춘다. */
function seoulDateParts(date: Date): { y: string; m: string; d: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const v = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return { y: v.year ?? '', m: v.month ?? '', d: v.day ?? '' }
}

/** 발급일자 — 년·월·일 (한국어, Asia/Seoul) */
export function formatCertificateIssueDate(date: Date = new Date()): string {
  const { y, m, d } = seoulDateParts(date)
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

export function certificateIssueDateIso(date: Date = new Date()): string {
  const { y, m, d } = seoulDateParts(date)
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

/** 인증서 좌측 상단 고유번호 텍스트 — 미리보기 플레이스홀더 / PDF 실번호 */
export const FORM_CERTIFICATE_SERIAL_TEXT_SELECTOR =
  '.form-certificate-preview__serial-text, [data-certificate-serial="text"]'

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
