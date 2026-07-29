import { describe, expect, it } from 'vitest'
import {
  applyInstructorPermissionRevokedToUser,
  normalizeRevokedInstructorUser,
} from './apply-instructor-permission-revoked'

describe('applyInstructorPermissionRevokedToUser', () => {
  it('순수 강사는 개인으로 전환하고 REVOKED를 남긴다', () => {
    const next = applyInstructorPermissionRevokedToUser({
      id: 'u1',
      email: 'a@test.com',
      name: '순수강사',
      role: 'INSTRUCTOR',
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

    expect(next.role).toBe('INDIVIDUAL')
    expect(next.instructorMemberProfile).toBeUndefined()
    expect(next.instructorInfo).toBeUndefined()
    expect(next.instructorApprovalStatus).toBe('REVOKED')
  })

  it('겸직·교사 강사는 school_teacher로 남기고 REVOKED를 남긴다', () => {
    const next = applyInstructorPermissionRevokedToUser({
      id: 'u2',
      email: 'b@test.com',
      name: '겸직강사',
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'instructor_dual',
      affiliatedSchoolUserId: 'school-1',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    })

    expect(next.role).toBe('INSTRUCTOR')
    expect(next.instructorMemberProfile).toBe('school_teacher')
    expect(next.instructorApprovalStatus).toBe('REVOKED')
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
