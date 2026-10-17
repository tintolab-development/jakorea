import type { ReactNode } from 'react'

export type CalendarMonthEventTitleParts = {
  left: string
  right?: string
}

/** 월간 `.calendar-event` strip 내부 — 이름 | 보조 텍스트 (구분선 + 0.6 opacity 보조색) */
export function CalendarMonthEventTitleWithDivider({
  parts,
  accentColor: _accentColor,
}: {
  parts: CalendarMonthEventTitleParts
  /** @deprecated 칩 텍스트색은 CSS `--Netural-black` — 호환용으로만 유지 */
  accentColor: string
}) {
  if (!parts.right) {
    return <span className="calendar-event-title">{parts.left}</span>
  }
  return (
    <div className="calendar-event-title calendar-event-title--with-divider">
      <span className="calendar-event-title__left">{parts.left}</span>
      <span className="calendar-event-title__divider" aria-hidden />
      <span className="calendar-event-title__right">{parts.right}</span>
    </div>
  )
}

export function defaultCalendarMonthEventTitle(
  title: string,
  _accentColor: string
): ReactNode {
  const displayTitle = title.replace(/^\[.*?\]\s*/, '').trim()
  return <span className="calendar-event-title">{displayTitle}</span>
}
