import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

/** 해당 월의 셋째 주 화요일 (강의비 지급 예정일 기본값) */
export function thirdTuesdayOfMonth(monthRef: Dayjs): Dayjs {
  let d = monthRef.startOf('month')
  let count = 0
  const m = monthRef.month()
  while (d.month() === m) {
    if (d.day() === 2) {
      count++
      if (count === 3) return d
    }
    d = d.add(1, 'day')
  }
  return monthRef.date(15)
}

/** 일괄·단건 확인 모달 기본값 — 다음 달 셋째 주 화요일 */
export function defaultLectureFeePaymentScheduledDate(now = dayjs()): Dayjs {
  return thirdTuesdayOfMonth(now.add(1, 'month'))
}
