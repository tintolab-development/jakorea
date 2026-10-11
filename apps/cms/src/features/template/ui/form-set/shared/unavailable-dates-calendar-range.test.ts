import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  isOutsideInclusiveLocalDayRange,
  normalizeRangeSealToLocalDayBounds,
} from './unavailable-dates-calendar-range'

describe('unavailable-dates-calendar-range', () => {
  it('면접 기간 seal을 로컬 일자 경계로 정규화한다', () => {
    const range = normalizeRangeSealToLocalDayBounds({
      start: '2026-10-01T00:00:00.000+09:00',
      end: '2026-10-23T00:00:00.000+09:00',
    })
    expect(range).not.toBeNull()
    const [start, end] = range!
    expect(start.format('YYYY-MM-DD')).toBe('2026-10-01')
    expect(end.format('YYYY-MM-DD')).toBe('2026-10-23')
    expect(isOutsideInclusiveLocalDayRange(dayjs('2026-10-12'), range)).toBe(false)
    expect(isOutsideInclusiveLocalDayRange(dayjs('2026-09-30'), range)).toBe(true)
    expect(isOutsideInclusiveLocalDayRange(dayjs('2026-10-24'), range)).toBe(true)
  })

  it('range가 null이면 isOutside는 true(전일 outside) — UI 게이트는 별도', () => {
    expect(isOutsideInclusiveLocalDayRange(dayjs('2026-10-12'), null)).toBe(true)
  })
})
