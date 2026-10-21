import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  formatKoreanYearMonthDayWithWeekday,
  formatShortYearMdWithKoreanWeekday,
  formatYmdCompactNoSpaceWithKoreanWeekday,
  formatYmdHmWithKoreanWeekday,
  formatYmdWithKoreanWeekday,
} from './format-date-korean-weekday'

describe('format-date-korean-weekday', () => {
  it('영문 요일(ddd) 대신 한글 요일을 쓴다', () => {
    const d = dayjs('2026-11-20T12:00:00')
    expect(formatShortYearMdWithKoreanWeekday(d)).toBe('26년 11월 20일(금)')
    expect(formatYmdCompactNoSpaceWithKoreanWeekday(d)).toBe('2026.11.20(금)')
    expect(formatKoreanYearMonthDayWithWeekday(d)).toBe('2026년 11월 20일(금)')
  })

  it('피커 선택값은 YYYY. MM. DD(요일) HH:mm 이다', () => {
    const d = dayjs('2026-01-09 09:20')
    expect(formatYmdWithKoreanWeekday(d)).toBe('2026. 01. 09(금)')
    expect(formatYmdHmWithKoreanWeekday(d)).toBe('2026. 01. 09(금) 09:20')
  })
})
