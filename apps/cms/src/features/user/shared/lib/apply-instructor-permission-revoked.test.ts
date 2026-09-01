import { describe, expect, it } from 'vitest'
import {
  applyInstructorPermissionRevokedToUser,
  normalizeRevokedInstructorUser,
} from './apply-instructor-permission-revoked'

describe('applyInstructorPermissionRevokedToUser', () => {
  it('순수 강사는 강사 상세를 유지하고 REVOKED를 남긴다', () => {
    const next = applyInstructorPermissionRevokedToUser({
      id: 'u1',
      email: 'a@test.com',
      name: '순수강사',
      role: 'INSTRUCTOR',
      roles: ['INSTRUCTOR'],
      instructorMemberProfile: 'instructor_only',
      instructorInfo: {
        bankName: '국민',
        accountNumber: '1',
        accountHolder: '순수강사',
        isBusinessIncome: false,
      },
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    })

    expect(next.role).toBe('INSTRUCTOR')
    expect(next.instructorMemberProfile).toBe('instructor_only')
    expect(next.roles).toEqual(['INSTRUCTOR_REVOKED'])
    expect(next.instructorInfo).toEqual({
      bankName: '국민',
      accountNumber: '1',
      accountHolder: '순수강사',
      isBusinessIncome: false,
    })
    expect(next.instructorApprovalStatus).toBe('REVOKED')
  })

  it('겸직 강사는 겸직 상세를 유지하고 INSTRUCTOR_REVOKED로 바꾼다', () => {
    const next = applyInstructorPermissionRevokedToUser({
      id: 'u2',
      email: 'b@test.com',
      name: '겸직강사',
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'instructor_dual',
      roles: ['INSTRUCTOR', 'SCHOOL_TEACHER'],
      affiliatedSchoolUserId: 'school-1',
      instructorInfo: {
        bankName: '우리',
        accountNumber: '2',
        accountHolder: '겸직강사',
        isBusinessIncome: true,
      },
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    })

    expect(next.role).toBe('INSTRUCTOR')
    expect(next.instructorMemberProfile).toBe('instructor_dual')
    expect(next.instructorApprovalStatus).toBe('REVOKED')
    expect(next.roles).toEqual(['INSTRUCTOR_REVOKED', 'SCHOOL_TEACHER'])
    expect(next.instructorInfo?.bankName).toBe('우리')
  })
})

describe('normalizeRevokedInstructorUser', () => {
  it('REVOKED가 아니면 그대로 둔다', () => {
    const user = {
      id: 'u3',
      email: 'c@test.com',
      name: '강사',
      role: 'INSTRUCTOR' as const,
      instructorMemberProfile: 'instructor_only' as const,
      instructorApprovalStatus: 'APPROVED',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }
    expect(normalizeRevokedInstructorUser(user)).toBe(user)
  })
})
