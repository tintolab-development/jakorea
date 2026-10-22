import type { Dayjs } from 'dayjs'

function isStartOfDayClock(d: Dayjs): boolean {
  return d.hour() === 0 && d.minute() === 0 && d.second() === 0 && d.millisecond() === 0
}

/** 기간 피커 시간 OFF 저장값 — `endOf('day')` 또는 `23:59:00` */
function isInclusiveEndOfDayClock(d: Dayjs): boolean {
  if (d.hour() !== 23 || d.minute() !== 59) return false
  return d.second() === 0 || d.second() === 59
}

/**
 * 시작·종료에 실제 시각이 있으면 true.
 * 00:00~00:00 및 00:00~23:59(:00|:59)는 종일(시간 토글 OFF)로 본다.
 */
export function dateRangeUsesClockTime(a: Dayjs, b: Dayjs): boolean {
  const start = a.isAfter(b) ? b : a
  const end = a.isAfter(b) ? a : b
  if (!isStartOfDayClock(start)) return true
  if (isStartOfDayClock(end) || isInclusiveEndOfDayClock(end)) return false
  return true
}
