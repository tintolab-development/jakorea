import { describe, expect, it } from 'vitest'
import { toJavaLocalDate, toJavaLocalTime, toKoreanPhone } from './import-wire-values'

describe('gemini training report import wire values', () => {
  it('pads a one-digit hour to ISO local time', () => {
    expect(toJavaLocalTime('9:00')).toBe('09:00:00')
    expect(toJavaLocalTime('10:00:00 AM')).toBe('10:00:00')
    expect(toJavaLocalTime('오후 1:30:00')).toBe('13:30:00')
  })

  it('omits a time Jackson LocalTime cannot read', () => {
    expect(toJavaLocalTime('열 시')).toBeUndefined()
  })

  it('normalizes excel date text to ISO date', () => {
    expect(toJavaLocalDate('2026.09.30')).toBe('2026-09-30')
    expect(toJavaLocalDate('2026년 9월 30일')).toBe('2026-09-30')
    expect(toJavaLocalDate('교육일 미정')).toBeUndefined()
  })

  it('hyphenates a mobile number', () => {
    expect(toKoreanPhone('01012345678')).toBe('010-1234-5678')
    expect(toKoreanPhone('010-1234-5678')).toBe('010-1234-5678')
    expect(toKoreanPhone('010')).toBeUndefined()
  })
})
