import { describe, expect, it } from 'vitest'
import { formatDateDot, formatDateRangeDot, formatDateTimeDot } from './date'

describe('formatDateDot', () => {
  it('YYYY.MM.DD로 패딩한다', () => {
    expect(formatDateDot('2026-1-2')).toBe('2026.01.02')
    expect(formatDateDot('2026-09-15')).toBe('2026.09.15')
    expect(formatDateDot('2026.1.2')).toBe('2026.01.02')
  })

  it('빈 값과 잘못된 값은 -로 표시한다', () => {
    expect(formatDateDot(null)).toBe('-')
    expect(formatDateDot('')).toBe('-')
    expect(formatDateDot('not-a-date')).toBe('-')
  })
})

describe('formatDateTimeDot', () => {
  it('YYYY.MM.DD HH:mm으로 표시한다', () => {
    expect(formatDateTimeDot('2026-09-15T14:03:09')).toBe('2026.09.15 14:03')
  })
})

describe('formatDateRangeDot', () => {
  it('시작·종료를 YYYY.MM.DD ~ YYYY.MM.DD로 연결한다', () => {
    expect(formatDateRangeDot('2026-1-2', '2026-12-31')).toBe('2026.01.02 ~ 2026.12.31')
  })

  it('한쪽이라도 없으면 -이다', () => {
    expect(formatDateRangeDot('2026-01-02', null)).toBe('-')
    expect(formatDateRangeDot(undefined, '2026-01-02')).toBe('-')
  })
})
