import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { findNextEnabledDate, toValidDayjs, toValidDayjsOrNull } from './date-time-picker-shared'

describe('toValidDayjsOrNull', () => {
  it('ISO string을 Dayjs로 복원한다', () => {
    const parsed = toValidDayjsOrNull('2026-09-21T00:00:00.000Z')
    expect(parsed?.isValid()).toBe(true)
    expect(parsed?.toISOString()).toBe('2026-09-21T00:00:00.000Z')
  })

  it('유효한 Dayjs는 그대로 반환한다', () => {
    const value = dayjs('2026-09-21')
    expect(toValidDayjsOrNull(value)).toBe(value)
  })

  it('빈 값·잘못된 값은 null이다', () => {
    expect(toValidDayjsOrNull(null)).toBeNull()
    expect(toValidDayjsOrNull('')).toBeNull()
    expect(toValidDayjsOrNull('not-a-date')).toBeNull()
  })
})

describe('findNextEnabledDate', () => {
  it('ISO string이어도 startOf를 호출할 수 있다', () => {
    const next = findNextEnabledDate('2026-09-21T00:00:00.000Z' as never)
    expect(typeof next.startOf).toBe('function')
    expect(next.startOf('month').format('YYYY-MM')).toBe('2026-09')
  })

  it('비활성화된 날짜면 다음 활성일을 반환한다', () => {
    const start = dayjs('2026-09-21')
    const next = findNextEnabledDate(start, date => date.isSame(start, 'day'))
    expect(next.format('YYYY-MM-DD')).toBe('2026-09-22')
  })

  it('잘못된 값은 오늘 근처 fallback을 쓴다', () => {
    const next = findNextEnabledDate('not-a-date' as never)
    expect(next.isValid()).toBe(true)
    expect(next.isSame(toValidDayjs('not-a-date'), 'day')).toBe(true)
  })
})
