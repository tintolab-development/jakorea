import { DISPLAY_DATE_TIMEZONE } from '@/shared/lib/format-display-date'

const DATE_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_DATE_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

/** 알림 생성일 — 예: 2026년 1월 15일 (월·일 0 채움 없음, 알림 목록 시안 12102-24557) */
export function formatNotificationDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const parts = Object.fromEntries(
    DATE_PARTS.formatToParts(date).map(part => [part.type, part.value]),
  )
  return `${parts.year}년 ${parts.month}월 ${parts.day}일`
}

/** 알림 목록 2줄 — 알림 본문(message)의 첫 번째 비어 있지 않은 줄 */
export function formatNotificationBodyFirstLine(message: string | null | undefined): string {
  const firstLine = message
    ?.split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line.length > 0)
  return firstLine || '-'
}
