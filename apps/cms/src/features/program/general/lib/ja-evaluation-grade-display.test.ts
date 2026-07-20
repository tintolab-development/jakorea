import { describe, expect, it } from 'vitest'
import { formatJaEvaluationGradeCellDisplay } from './ja-evaluation-grade-display'

describe('formatJaEvaluationGradeCellDisplay', () => {
  it('평가 등급이 없으면 - 를 반환한다', () => {
    expect(formatJaEvaluationGradeCellDisplay(undefined)).toBe('-')
    expect(formatJaEvaluationGradeCellDisplay(null)).toBe('-')
    expect(formatJaEvaluationGradeCellDisplay('')).toBe('-')
    expect(formatJaEvaluationGradeCellDisplay('   ')).toBe('-')
  })

  it('등급 코드에 등급 접미사를 붙인다', () => {
    expect(formatJaEvaluationGradeCellDisplay('A')).toBe('A등급')
    expect(formatJaEvaluationGradeCellDisplay('B등급')).toBe('B등급')
  })
})
