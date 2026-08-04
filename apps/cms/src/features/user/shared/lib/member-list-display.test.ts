import { describe, expect, it } from 'vitest'
import {
  getAllMemberListRoleTypeLabel,
  isInstructorPermissionRevoked,
} from './member-list-display'
import { markInstructorPermissionRevoked } from './revoked-instructor-overlay'

describe('isInstructorPermissionRevoked', () => {
  it('REVOKED 상태면 true', () => {
    expect(isInstructorPermissionRevoked({ instructorApprovalStatus: 'REVOKED' })).toBe(true)
    expect(isInstructorPermissionRevoked({ instructorApprovalStatus: 'revoked' })).toBe(true)
  })

  it('그 외는 false', () => {
    expect(isInstructorPermissionRevoked({ instructorApprovalStatus: 'APPROVED' })).toBe(false)
    expect(isInstructorPermissionRevoked({})).toBe(false)
  })

  it('세션 오버레이로 박탈 표시', () => {
    markInstructorPermissionRevoked({ id: 'overlay-user-1', memberId: 9001 })
    expect(isInstructorPermissionRevoked({ id: 'overlay-user-1' })).toBe(true)
    expect(
      getAllMemberListRoleTypeLabel({
        id: 'overlay-user-1',
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_only',
      })
    ).toBe('강사(권한박탈)')
  })
})

describe('getAllMemberListRoleTypeLabel', () => {
  it('권한 박탈 강사는 강사(권한박탈)', () => {
    expect(
      getAllMemberListRoleTypeLabel({
        role: 'INDIVIDUAL',
        instructorApprovalStatus: 'REVOKED',
      })
    ).toBe('강사(권한박탈)')
    expect(
      getAllMemberListRoleTypeLabel({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_only',
        instructorApprovalStatus: 'REVOKED',
      })
    ).toBe('강사(권한박탈)')
  })

  it('일반 강사는 강사', () => {
    expect(
      getAllMemberListRoleTypeLabel({
        id: 'normal-instructor',
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_only',
      })
    ).toBe('강사')
  })
})
