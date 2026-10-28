import { describe, expect, it } from 'vitest'
import {
  formatUjatGradeClassDisplayLabel,
  formatUjatGradeClassDisplayLabelFromParts,
} from './ujat-grade-class-display'

describe('formatUjatGradeClassDisplayLabel', () => {
  it.each([
    ['3학년 1반', '3학년 1반'],
    ['3학년 1', '3학년 1반'],
    ['3 1반', '3학년 1반'],
    ['3-1', '3학년 1반'],
    ['3/1', '3학년 1반'],
    ['  3   학년   1   반  ', '3학년 1반'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatUjatGradeClassDisplayLabel(value)).toBe(expected)
  })

  it('does not invent a grade when only a class label is available', () => {
    expect(formatUjatGradeClassDisplayLabel('1반')).toBe('1반')
    expect(formatUjatGradeClassDisplayLabel('미배정')).toBe('미배정')
    expect(formatUjatGradeClassDisplayLabel(null)).toBe('-')
  })
})

describe('formatUjatGradeClassDisplayLabelFromParts', () => {
  it('formats numeric grade and class values from schedule slots', () => {
    expect(formatUjatGradeClassDisplayLabelFromParts('3', '1반')).toBe('3학년 1반')
    expect(formatUjatGradeClassDisplayLabelFromParts('3학년', '1')).toBe('3학년 1반')
  })
})
