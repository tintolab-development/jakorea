import { describe, expect, it } from 'vitest'
import { applyAffiliatedTeacherLinkToUser } from './apply-affiliated-teacher-link'
import type { User } from '@/types/user'

describe('applyAffiliatedTeacherLinkToUser', () => {
  it('소속 교사 목록 행 이름으로 API 기관명 name을 덮어쓴다', () => {
    const user: Omit<User, 'password'> = {
      id: 'teacher-1',
      email: 'teacher@example.com',
      name: 'JA 테스트 중학교',
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'school_teacher',
      affiliatedSchoolName: 'JA 테스트 중학교',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }

    const next = applyAffiliatedTeacherLinkToUser(
      user,
      { name: '박충재', assignedGrade: '2학년' },
      'JA 테스트 중학교'
    )

    expect(next.name).toBe('박충재')
    expect(next.schoolInfo).toBeUndefined()
    expect(next.listMetrics?.instructorAssignedGrade).toBe('2학년')
  })
})
