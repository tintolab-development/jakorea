import { describe, expect, it } from 'vitest'
import {
  formatUjatPreviousActivityTermLabel,
  formatUjatPreviousActivityYearLabel,
} from './previous-term-display'

describe('formatUjatPreviousActivityTermLabel', () => {
  it('숫자·기 접미사 모두 30기로 맞춘다', () => {
    expect(formatUjatPreviousActivityTermLabel('30')).toBe('30기')
    expect(formatUjatPreviousActivityTermLabel('30기')).toBe('30기')
    expect(formatUjatPreviousActivityTermLabel(' 5기 ')).toBe('5기')
  })

  it('빈 값은 빈 문자열', () => {
    expect(formatUjatPreviousActivityTermLabel('')).toBe('')
    expect(formatUjatPreviousActivityTermLabel(null)).toBe('')
  })
})

describe('formatUjatPreviousActivityYearLabel', () => {
  it('년도 접미사 중복을 막는다', () => {
    expect(formatUjatPreviousActivityYearLabel('2023')).toBe('2023년도')
    expect(formatUjatPreviousActivityYearLabel('2023년도')).toBe('2023년도')
  })
})
