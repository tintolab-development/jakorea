import { describe, expect, it } from 'vitest'
import {
  inferInstructorMemberProfileFromRoles,
  memberRolesIncludeInstructorRevoked,
  memberRolesIncludeSchool,
  memberRolesIncludeSchoolTeacher,
  parseLegacyRoleFilterParam,
  resolveInstructorMemberProfileHint,
  resolvePrimaryUserRole,
  resolvePrimaryUserRoleFromRoles,
} from './map-member-role'

describe('resolvePrimaryUserRoleFromRoles', () => {
  it('roles 배열만으로 우선순위 역할을 고른다', () => {
    expect(resolvePrimaryUserRoleFromRoles(['INDIVIDUAL', 'INSTRUCTOR'])).toBe('INSTRUCTOR')
    expect(resolvePrimaryUserRoleFromRoles(['SCHOOL'])).toBe('SCHOOL')
  })

  it('SCHOOL_TEACHER 단독은 INSTRUCTOR로 올린다 (교사 상세)', () => {
    expect(resolvePrimaryUserRoleFromRoles(['SCHOOL_TEACHER'])).toBe('INSTRUCTOR')
    expect(resolvePrimaryUserRoleFromRoles(['SCHOOL_TEACHER', 'INSTRUCTOR'])).toBe('INSTRUCTOR')
    // SCHOOL 기관 역할과는 구분
    expect(memberRolesIncludeSchool(['SCHOOL_TEACHER'])).toBe(false)
  })
})

describe('resolvePrimaryUserRole fallback', () => {
  it('fallbackRole은 상세 등 roles 보조용으로만 사용', () => {
    expect(resolvePrimaryUserRole([], 'INSTRUCTOR')).toBe('INSTRUCTOR')
    expect(resolvePrimaryUserRole(['SCHOOL'], 'SCHOOL_TEACHER')).toBe('SCHOOL')
  })
})

describe('parseLegacyRoleFilterParam', () => {
  it('SCHOOL_TEACHER·INSTRUCTOR_REVOKED는 필터 role로 노출하지 않는다', () => {
    expect(parseLegacyRoleFilterParam('SCHOOL_TEACHER')).toBeUndefined()
    expect(parseLegacyRoleFilterParam('INSTRUCTOR_REVOKED')).toBeUndefined()
    expect(parseLegacyRoleFilterParam('SCHOOL')).toBe('SCHOOL')
    expect(parseLegacyRoleFilterParam('ALL')).toBeUndefined()
  })
})

describe('memberRolesIncludeSchool', () => {
  it('roles에 SCHOOL이 있을 때만 true', () => {
    expect(memberRolesIncludeSchool(['SCHOOL'])).toBe(true)
    expect(memberRolesIncludeSchool(['INSTITUTION'])).toBe(true)
    expect(memberRolesIncludeSchool(['INSTRUCTOR'])).toBe(false)
    expect(memberRolesIncludeSchool(['SCHOOL_TEACHER'])).toBe(false)
  })
})

describe('memberRolesIncludeSchoolTeacher', () => {
  it('SCHOOL_TEACHER·school_teacher 토큰을 인식한다', () => {
    expect(memberRolesIncludeSchoolTeacher(['SCHOOL_TEACHER'])).toBe(true)
    expect(memberRolesIncludeSchoolTeacher(['school_teacher'])).toBe(true)
    expect(memberRolesIncludeSchoolTeacher(['SCHOOL'])).toBe(false)
    expect(memberRolesIncludeSchoolTeacher(['INSTRUCTOR'])).toBe(false)
  })
})

describe('memberRolesIncludeInstructorRevoked', () => {
  it('INSTRUCTOR_REVOKED만 true', () => {
    expect(memberRolesIncludeInstructorRevoked(['INSTRUCTOR_REVOKED'])).toBe(true)
    expect(memberRolesIncludeInstructorRevoked(['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'])).toBe(
      true
    )
    expect(memberRolesIncludeInstructorRevoked(['INSTRUCTOR'])).toBe(false)
    expect(memberRolesIncludeInstructorRevoked(undefined)).toBe(false)
  })
})

describe('inferInstructorMemberProfileFromRoles', () => {
  it('교사 단독은 school_teacher, 강사 겸직은 instructor_dual, 순수 강사는 instructor_only', () => {
    expect(inferInstructorMemberProfileFromRoles(['SCHOOL_TEACHER'])).toBe('school_teacher')
    expect(inferInstructorMemberProfileFromRoles(['SCHOOL_TEACHER', 'INSTRUCTOR'])).toBe(
      'instructor_dual'
    )
    expect(inferInstructorMemberProfileFromRoles(['INSTRUCTOR'])).toBe('instructor_only')
    expect(inferInstructorMemberProfileFromRoles(['SCHOOL'])).toBeUndefined()
    expect(inferInstructorMemberProfileFromRoles(['INDIVIDUAL'])).toBeUndefined()
  })

  it('INSTRUCTOR_REVOKED는 강사 토큰으로 본다', () => {
    expect(inferInstructorMemberProfileFromRoles(['INSTRUCTOR_REVOKED'])).toBe('instructor_only')
    expect(inferInstructorMemberProfileFromRoles(['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'])).toBe(
      'instructor_dual'
    )
    expect(resolvePrimaryUserRoleFromRoles(['INSTRUCTOR_REVOKED'])).toBe('INSTRUCTOR')
  })
})

describe('resolveInstructorMemberProfileHint', () => {
  it('roles가 있으면 API instructorMemberProfile보다 우선한다', () => {
    expect(
      resolveInstructorMemberProfileHint({
        roles: ['SCHOOL_TEACHER'],
        instructorMemberProfile: 'instructor_dual',
      })
    ).toBe('school_teacher')
    expect(
      resolveInstructorMemberProfileHint({
        roles: ['INSTRUCTOR', 'SCHOOL_TEACHER'],
        instructorMemberProfile: 'school_teacher',
      })
    ).toBe('instructor_dual')
    expect(
      resolveInstructorMemberProfileHint({
        roles: ['INSTRUCTOR'],
        instructorMemberProfile: 'school_teacher',
      })
    ).toBe('instructor_only')
    expect(
      resolveInstructorMemberProfileHint({
        instructorMemberProfile: 'instructor_only',
      })
    ).toBe('instructor_only')
  })
})
