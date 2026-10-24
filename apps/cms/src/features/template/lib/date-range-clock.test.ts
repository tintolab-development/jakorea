import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { dateRangeUsesClockTime } from './date-range-clock'

describe('dateRangeUsesClockTime', () => {
  it('00:00 ~ 00:00 은 시간 없음', () => {
    const start = dayjs('2026-10-05').startOf('day')
    const end = dayjs('2026-10-12').startOf('day')
    expect(dateRangeUsesClockTime(start, end)).toBe(false)
  })

  it('00:00 ~ 23:59:59.999 은 시간 없음', () => {
    const start = dayjs('2026-10-05').startOf('day')
    const end = dayjs('2026-10-12').endOf('day')
    expect(dateRangeUsesClockTime(start, end)).toBe(false)
  })

  it('00:00 ~ 23:59:00 도 시간 없음', () => {
    const start = dayjs('2026-10-05').startOf('day')
    const end = dayjs('2026-10-12').hour(23).minute(59).second(0).millisecond(0)
    expect(dateRangeUsesClockTime(start, end)).toBe(false)
  })

  it('09:00 ~ 12:00 은 시간 있음', () => {
    const start = dayjs('2026-10-05').hour(9).minute(0).second(0).millisecond(0)
    const end = dayjs('2026-10-05').hour(12).minute(0).second(0).millisecond(0)
    expect(dateRangeUsesClockTime(start, end)).toBe(true)
  })

  it('00:00 ~ 10:00 은 시간 있음', () => {
    const start = dayjs('2026-10-05').startOf('day')
    const end = dayjs('2026-10-05').hour(10).minute(0).second(0).millisecond(0)
    expect(dateRangeUsesClockTime(start, end)).toBe(true)
  })
})
