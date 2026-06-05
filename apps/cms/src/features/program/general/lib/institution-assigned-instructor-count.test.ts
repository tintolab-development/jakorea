import { describe, expect, it } from 'vitest'
import { countAssignedInstructors } from '@/features/program/general/lib/institution-assigned-instructor-count'

describe('countAssignedInstructors', () => {
  it('빈 값은 0명으로 처리한다', () => {
    expect(countAssignedInstructors()).toBe(0)
    expect(countAssignedInstructors('')).toBe(0)
    expect(countAssignedInstructors('   ')).toBe(0)
  })

  it('단일 강사명은 1명으로 처리한다', () => {
    expect(countAssignedInstructors('김강사')).toBe(1)
  })

  it('구분자로 나뉜 복수 강사명을 센다', () => {
    expect(countAssignedInstructors('김강사, 이강사, 박강사')).toBe(3)
    expect(countAssignedInstructors('김강사 / 이강사')).toBe(2)
  })
})
