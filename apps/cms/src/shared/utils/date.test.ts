import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateDot,
  formatDateDotWithWeekday,
  formatDateRangeDot,
  formatDateRangeDotWithWeekday,
  formatDateSpaced,
  formatDateTimeDot,
  formatDateTimeDotWithWeekday,
  formatDateTimeSecondsDot,
} from './date'

describe('formatDate', () => {
  it('잘못된 날짜가 들어와도 예외 대신 -를 반환한다', () => {
    expect(formatDate('not-a-date')).toBe('-')
    expect(formatDate(null)).toBe('-')
  })
})

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
  it('표시는 공백 없는 YYYY.MM.DD다', () => {
    expect(formatDateSpaced('2025-09-15')).toBe('2025.09.15')
    expect(formatDateSpaced('2026-1-2')).toBe('2026.01.02')
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

describe('formatDateTimeSecondsDot', () => {
  it('YYYY.MM.DD HH:mm:ss로 표시한다', () => {
    expect(formatDateTimeSecondsDot('2026-04-20T09:30:42')).toBe('2026.04.20 09:30:42')
  })
})

describe('formatDateDotWithWeekday', () => {
  it('YYYY.MM.DD(요일)이고 점·괄호 앞뒤 공백이 없다', () => {
    expect(formatDateDotWithWeekday('2026-04-20')).toBe('2026.04.20(월)')
    expect(formatDateDotWithWeekday('2026-01-09')).toBe('2026.01.09(금)')
  })
})

describe('formatDateTimeDotWithWeekday', () => {
  it('YYYY.MM.DD(요일) HH:mm이다', () => {
    expect(formatDateTimeDotWithWeekday('2026-04-20T09:30:00')).toBe('2026.04.20(월) 09:30')
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

describe('formatDateRangeDotWithWeekday', () => {
  it('양쪽에 요일을 붙인다', () => {
    expect(formatDateRangeDotWithWeekday('2026-04-20', '2026-11-20')).toBe(
      '2026.04.20(월) ~ 2026.11.20(금)'
    )
  })
})
