import { describe, expect, it } from 'vitest'
import { matchesInstructorJaEvaluationGradeFilter } from '@/entities/user/lib/matches-instructor-list-filters'
import type { User } from '@/types/user'

function instructor(grade?: string): Omit<User, 'password'> {
  return {
    id: 'u1',
    email: 'a@b.c',
    name: '강사',
    role: 'INSTRUCTOR',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    listMetrics: grade != null ? { jaEvaluationGrade: grade } : undefined,
  }
}

describe('matchesInstructorJaEvaluationGradeFilter', () => {
  it('전체·빈 값은 모두 통과', () => {
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('A'), '')).toBe(true)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('A'), 'all')).toBe(true)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor(undefined), '')).toBe(true)
  })

  it('A / A등급 / JA_A 행을 A 필터에 매칭한다', () => {
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('A'), 'A')).toBe(true)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('A등급'), 'A')).toBe(true)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('JA_A'), 'A')).toBe(true)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('B'), 'A')).toBe(false)
  })

  it('미평가(등급 없음)는 특정 등급 필터에 걸리지 않는다', () => {
    expect(matchesInstructorJaEvaluationGradeFilter(instructor(undefined), 'D')).toBe(false)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor(''), 'D')).toBe(false)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('-'), 'D')).toBe(false)
    expect(matchesInstructorJaEvaluationGradeFilter(instructor('D'), 'D')).toBe(true)
  })
})
