import { describe, expect, it } from 'vitest'
import { formatGeminiInstructorApplicationGrade } from './instructor-application-grade-label'

describe('formatGeminiInstructorApplicationGrade', () => {
  it('maps JA grades and fee GRADE_2 without leaking raw codes', () => {
    expect(formatGeminiInstructorApplicationGrade('A')).toBe('A등급')
    expect(formatGeminiInstructorApplicationGrade('GRADE_2')).toBe('2급 강사비')
    expect(formatGeminiInstructorApplicationGrade(null, 'GRADE_1')).toBe('1급 강사비')
    expect(formatGeminiInstructorApplicationGrade(null, null)).toBe('-')
  })
})
