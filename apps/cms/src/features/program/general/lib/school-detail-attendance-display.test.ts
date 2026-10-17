import { describe, expect, it } from 'vitest'
import { formatStudentGradeClassColumnLabel } from './student-registered-grade-class-options'

describe('formatStudentGradeClassColumnLabel', () => {
  it('shows class only when grade and class are combined', () => {
    expect(formatStudentGradeClassColumnLabel('초5 1반')).toBe('1반')
    expect(formatStudentGradeClassColumnLabel('초5 200반')).toBe('200반')
  })

  it('shows class when only 반 label is stored', () => {
    expect(formatStudentGradeClassColumnLabel('1반')).toBe('1반')
  })

  it('extracts trailing N반 from compact labels', () => {
    expect(formatStudentGradeClassColumnLabel('초2반')).toBe('2반')
  })
})
