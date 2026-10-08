import { describe, expect, it } from 'vitest'
import {
  InvalidAttendanceArrivalTimeError,
  formatArrivalTimeForDisplay,
  toIsoLocalTime,
} from './attendance-arrival-time'

describe('toIsoLocalTime', () => {
  it('시·분을 두 자리로 맞춘다', () => {
    expect(toIsoLocalTime('9:00')).toBe('09:00')
    expect(toIsoLocalTime('9:05')).toBe('09:05')
    expect(toIsoLocalTime('8:5')).toBe('08:05')
    expect(toIsoLocalTime('13:05')).toBe('13:05')
  })

  it('초가 있으면 유지한다', () => {
    expect(toIsoLocalTime('09:10:30')).toBe('09:10:30')
    expect(toIsoLocalTime('9:10:0')).toBe('09:10:00')
  })

  it('빈 값은 null', () => {
    expect(toIsoLocalTime(undefined)).toBeNull()
    expect(toIsoLocalTime(null)).toBeNull()
    expect(toIsoLocalTime('')).toBeNull()
    expect(toIsoLocalTime('  ')).toBeNull()
  })

  it('잘못된 값은 예외', () => {
    for (const value of ['25:00', '9:60', '9시', '오전 9:00', '0900']) {
      expect(() => toIsoLocalTime(value)).toThrow(InvalidAttendanceArrivalTimeError)
    }
  })
})

describe('formatArrivalTimeForDisplay', () => {
  it('응답값을 H:mm 으로 표시한다', () => {
    expect(formatArrivalTimeForDisplay('09:00')).toBe('9:00')
    expect(formatArrivalTimeForDisplay('09:10:30')).toBe('9:10')
    expect(formatArrivalTimeForDisplay('13:05')).toBe('13:05')
  })

  it('빈 값은 undefined, 해석 불가 값은 원문', () => {
    expect(formatArrivalTimeForDisplay(undefined)).toBeUndefined()
    expect(formatArrivalTimeForDisplay('')).toBeUndefined()
    expect(formatArrivalTimeForDisplay('unknown')).toBe('unknown')
  })
})
