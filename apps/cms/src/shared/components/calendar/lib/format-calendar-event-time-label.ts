/** 캘린더 Hover·우측 목록·주간 칩 표시용. 격자 높이(+1h)와 분리한다. */
export const CALENDAR_ALL_DAY_TIME_LABEL = '종일'

function trimClock(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * 명시 HH:mm 필드만 표시한다.
 * 시작·종료 없음 → 종일 / 시작만 → HH:mm / 둘 다 → HH:mm ~ HH:mm
 * 레이아웃용 종료(+1시간)를 합성하지 않는다.
 */
export function formatCalendarEventTimeLabel(
  startTime?: string | null,
  endTime?: string | null
): string {
  const start = trimClock(startTime)
  const end = trimClock(endTime)
  if (start && end) return `${start} ~ ${end}`
  if (start) return start
  return CALENDAR_ALL_DAY_TIME_LABEL
}
