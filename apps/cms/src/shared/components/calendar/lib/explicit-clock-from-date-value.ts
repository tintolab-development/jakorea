import dayjs from 'dayjs'
import type { DateValue } from '@/types'

function isStartOfDayClock(hour: number, minute: number, second: number): boolean {
  return hour === 0 && minute === 0 && second === 0
}

/** 날짜 전용 종료 센티널 — `endOf('day')` 또는 23:59:00 */
function isInclusiveEndOfDayClock(hour: number, minute: number, second: number): boolean {
  if (hour !== 23 || minute !== 59) return false
  return second === 0 || second === 59
}

/**
 * DateValue ISO에서 표시용 HH:mm을 뽑는다.
 * T00:00:00 / T23:59(:00|:59)는 날짜 전용으로 보고 반환하지 않는다.
 * 실제 자정은 `startTime: '00:00'`처럼 시각 필드가 있을 때만 표시한다.
 */
export function explicitClockFromDateValue(value: DateValue | undefined | null): string | undefined {
  if (value == null) return undefined
  const d = dayjs(value instanceof Date ? value.toISOString() : value)
  if (!d.isValid()) return undefined
  const hour = d.hour()
  const minute = d.minute()
  const second = d.second()
  if (isStartOfDayClock(hour, minute, second)) return undefined
  if (isInclusiveEndOfDayClock(hour, minute, second)) return undefined
  return d.format('HH:mm')
}
