import { DISPLAY_DATE_TIMEZONE } from '@/shared/lib/format-display-date'

const DATE_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_DATE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** 알림 생성일 — 예: 2026.01.15 */
export function formatNotificationDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const parts = Object.fromEntries(
    DATE_PARTS.formatToParts(date).map(part => [part.type, part.value]),
  )
  return `${parts.year}.${parts.month}.${parts.day}`
}
