import { describe, expect, it } from 'vitest'
import { formatInstitutionApplicationGradeDisplay } from './institution-application-detail-edit-policy'

describe('formatInstitutionApplicationGradeDisplay', () => {
  it('학년만 남긴다', () => {
    expect(formatInstitutionApplicationGradeDisplay('1학년')).toBe('1학년')
    expect(formatInstitutionApplicationGradeDisplay('2')).toBe('2학년')
    expect(formatInstitutionApplicationGradeDisplay('초등학교 3학년')).toBe('3학년')
    expect(formatInstitutionApplicationGradeDisplay('JA초등학교 4학년')).toBe('4학년')
  })
})
