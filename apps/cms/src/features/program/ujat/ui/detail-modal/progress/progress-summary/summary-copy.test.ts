import { describe, expect, it } from 'vitest'
import {
  copyFromEducationProgressSummaryResponse,
  normalizeSummaryActivityTerm,
  schoolSemesterGroupLabel,
  volunteerFinalRowLabel,
  volunteerPassRowLabel,
} from './summary-copy'

describe('normalizeSummaryActivityTerm', () => {
  it('GET 기수 문자열만 정규화한다', () => {
    expect(normalizeSummaryActivityTerm('36')).toBe('36')
    expect(normalizeSummaryActivityTerm('36기')).toBe('36')
    expect(normalizeSummaryActivityTerm(null)).toBeNull()
    expect(normalizeSummaryActivityTerm('')).toBeNull()
  })
})

describe('copyFromEducationProgressSummaryResponse', () => {
  it('programYear와 기수는 GET만 쓰고 startDate를 쓰지 않는다', () => {
    expect(
      copyFromEducationProgressSummaryResponse({
        programYear: 2026,
        firstHalfActivityTerm: null,
        secondHalfActivityTerm: null,
      })
    ).toEqual({ year: 2026, firstHalfTerm: null, secondHalfTerm: null })
    expect(
      copyFromEducationProgressSummaryResponse({
        programYear: null,
        firstHalfActivityTerm: '36',
        secondHalfActivityTerm: '37',
      })
    ).toEqual({ year: null, firstHalfTerm: '36', secondHalfTerm: '37' })
  })
})

describe('summary copy labels', () => {
  it('피그마 카피를 연도·기수에 맞춰 만든다', () => {
    expect(schoolSemesterGroupLabel('h1', 2026)).toBe('1학기')
    expect(schoolSemesterGroupLabel('grand', 2026)).toBe('2026년 종합')
    expect(schoolSemesterGroupLabel('grand', null)).toBe('종합')
    expect(volunteerPassRowLabel('h1', '36')).toBe('36기 최종 합격')
    expect(volunteerPassRowLabel('h2', null)).toBe('2학기 최종 합격')
    expect(volunteerFinalRowLabel(2026)).toBe('2026 봉사단 최종 인원')
    expect(volunteerFinalRowLabel(null)).toBe('봉사단 최종 인원')
  })
})
