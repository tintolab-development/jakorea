import { describe, expect, it } from 'vitest'
import { formatDateDot, formatDateRangeDot, formatDateSpaced, formatDateTimeDot } from './date'

describe('formatDateDot', () => {
  it('YYYY.MM.DD로 패딩한다', () => {
    expect(formatDateDot('2026-1-2')).toBe('2026.01.02')
    expect(formatDateDot('2026-09-15')).toBe('2026.09.15')
    expect(formatDateDot('2026.1.2')).toBe('2026.01.02')
  })

  it('ISO date-time(Z/offset)도 YYYY.MM.DD로 표시한다', () => {
    expect(formatDateDot('2026-06-02T09:00:00Z')).toBe('2026.06.02')
    expect(formatDateDot('2026-06-02T09:00:00.000Z')).toBe('2026.06.02')
    expect(formatDateDot('2026-06-02T09:00:00+09:00')).toBe('2026.06.02')
  })

  it('빈 값과 잘못된 값은 -로 표시한다', () => {
    expect(formatDateDot(null)).toBe('-')
    expect(formatDateDot('')).toBe('-')
    expect(formatDateDot('not-a-date')).toBe('-')
  })
})

describe('formatDateSpaced', () => {
  it('YYYY. MM. DD(공백 포함)로 표시한다', () => {
    expect(formatDateSpaced('2025-09-15')).toBe('2025. 09. 15')
    expect(formatDateSpaced('2026-1-2')).toBe('2026. 01. 02')
  })

  it('빈 값과 잘못된 값은 -로 표시한다', () => {
    expect(formatDateSpaced(null)).toBe('-')
    expect(formatDateSpaced('')).toBe('-')
    expect(formatDateSpaced('not-a-date')).toBe('-')
  })
})

describe('formatDateTimeDot', () => {
  it('YYYY.MM.DD HH:mm으로 표시한다', () => {
    expect(formatDateTimeDot('2026-09-15T14:03:09')).toBe('2026.09.15 14:03')
  })

  it('ISO Z 타임스탬프도 파싱해 -가 되지 않는다', () => {
    expect(formatDateTimeDot('2026-09-15T14:03:09Z')).not.toBe('-')
    expect(formatDateTimeDot('2026-09-15T14:03:09Z')).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/)
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
