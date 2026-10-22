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
  it('QA-126 compact YYYY.MM.DD(요일)로 수렴한다', () => {
    const d = dayjs('2026-11-20T12:00:00')
    expect(formatShortYearMdWithKoreanWeekday(d)).toBe('2026.11.20(금)')
    expect(formatYmdCompactNoSpaceWithKoreanWeekday(d)).toBe('2026.11.20(금)')
  })

  it('일정 선택 UI 예외는 4자리 한글 연월일이다', () => {
    const d = dayjs('2026-04-20T12:00:00')
    expect(formatKoreanYearMonthDayWithWeekday(d)).toBe('2026년 4월 20일(월)')
  })

  it('피커 선택값은 YYYY.MM.DD(요일) HH:mm 이다', () => {
    const d = dayjs('2026-01-09 09:20')
    expect(formatYmdWithKoreanWeekday(d)).toBe('2026.01.09(금)')
    expect(formatYmdHmWithKoreanWeekday(d)).toBe('2026.01.09(금) 09:20')
  })
})
