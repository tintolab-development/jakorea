import { describe, expect, it } from 'vitest'
import {
  getAllMemberListRoleTypeLabel,
  isInstructorPermissionRevoked,
  matchesAllTabRoleFilter,
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

  it('교사 겸 강사 박탈은 학교(교사), 강사(권한박탈)', () => {
    expect(
      getAllMemberListRoleTypeLabel({
        role: 'INSTRUCTOR',
        roles: ['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'],
        instructorMemberProfile: 'instructor_dual',
        instructorApprovalStatus: 'REVOKED',
      })
    ).toBe('학교(교사), 강사(권한박탈)')
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

  it('SCHOOL_TEACHER(교사 단독)는 학교(교사)', () => {
    expect(
      getAllMemberListRoleTypeLabel({
        role: 'INDIVIDUAL',
        instructorMemberProfile: 'school_teacher',
      })
    ).toBe('학교(교사)')
  })

  it('교사 겸 강사는 학교(교사), 강사', () => {
    expect(
      getAllMemberListRoleTypeLabel({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_dual',
      })
    ).toBe('학교(교사), 강사')
  })
})

describe('matchesAllTabRoleFilter', () => {
  it('개인은 학교(교사)를 제외한다', () => {
    expect(matchesAllTabRoleFilter({ role: 'INDIVIDUAL' }, 'INDIVIDUAL')).toBe(true)
    expect(
      matchesAllTabRoleFilter(
        { role: 'INDIVIDUAL', instructorMemberProfile: 'school_teacher' },
        'INDIVIDUAL'
      )
    ).toBe(false)
    expect(
      matchesAllTabRoleFilter(
        { role: 'INDIVIDUAL', instructorMemberProfile: 'school_teacher' },
        'SCHOOL_TEACHER'
      )
    ).toBe(true)
  })

  it('강사와 겸직을 구분한다', () => {
    expect(
      matchesAllTabRoleFilter(
        { role: 'INSTRUCTOR', instructorMemberProfile: 'instructor_only' },
        'INSTRUCTOR'
      )
    ).toBe(true)
    expect(
      matchesAllTabRoleFilter(
        { role: 'INSTRUCTOR', instructorMemberProfile: 'instructor_dual' },
        'INSTRUCTOR'
      )
    ).toBe(false)
    expect(
      matchesAllTabRoleFilter(
        { role: 'INSTRUCTOR', instructorMemberProfile: 'instructor_dual' },
        'INSTRUCTOR_DUAL'
      )
    ).toBe(true)
  })

  it('강사(권한박탈) 필터는 순수·겸직 박탈을 모두 포함한다', () => {
    expect(
      matchesAllTabRoleFilter(
        {
          role: 'INSTRUCTOR',
          instructorMemberProfile: 'instructor_only',
          instructorApprovalStatus: 'REVOKED',
        },
        'INSTRUCTOR_REVOKED'
      )
    ).toBe(true)
    expect(
      matchesAllTabRoleFilter(
        {
          role: 'INSTRUCTOR',
          roles: ['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'],
          instructorMemberProfile: 'instructor_dual',
          instructorApprovalStatus: 'REVOKED',
        },
        'INSTRUCTOR_REVOKED'
      )
    ).toBe(true)
    expect(
      matchesAllTabRoleFilter(
        {
          role: 'INSTRUCTOR',
          roles: ['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'],
          instructorMemberProfile: 'instructor_dual',
          instructorApprovalStatus: 'REVOKED',
        },
        'INSTRUCTOR_DUAL'
      )
    ).toBe(false)
  })
})
