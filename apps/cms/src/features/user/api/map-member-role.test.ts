import { describe, expect, it } from 'vitest'
import {
  inferInstructorMemberProfileFromRoles,
  memberRolesIncludeSchool,
  memberRolesIncludeSchoolTeacher,
  parseLegacyRoleFilterParam,
  resolvePrimaryUserRole,
  resolvePrimaryUserRoleFromRoles,
} from './map-member-role'

describe('resolvePrimaryUserRoleFromRoles', () => {
  it('roles 배열만으로 우선순위 역할을 고른다', () => {
    expect(resolvePrimaryUserRoleFromRoles(['INDIVIDUAL', 'INSTRUCTOR'])).toBe('INSTRUCTOR')
    expect(resolvePrimaryUserRoleFromRoles(['SCHOOL'])).toBe('SCHOOL')
  })

  it('SCHOOL_TEACHER 토큰은 UserRole로 취급하지 않는다', () => {
    expect(resolvePrimaryUserRoleFromRoles(['SCHOOL_TEACHER'])).toBe('INDIVIDUAL')
    expect(resolvePrimaryUserRoleFromRoles(['SCHOOL_TEACHER', 'INSTRUCTOR'])).toBe('INSTRUCTOR')
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
  it('SCHOOL_TEACHER는 필터 role로 노출하지 않는다', () => {
    expect(parseLegacyRoleFilterParam('SCHOOL_TEACHER')).toBeUndefined()
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

describe('inferInstructorMemberProfileFromRoles', () => {
  it('교사 단독은 school_teacher, 강사 겸직은 instructor_dual', () => {
    expect(inferInstructorMemberProfileFromRoles(['SCHOOL_TEACHER'])).toBe('school_teacher')
    expect(inferInstructorMemberProfileFromRoles(['SCHOOL_TEACHER', 'INSTRUCTOR'])).toBe(
      'instructor_dual'
    )
    expect(inferInstructorMemberProfileFromRoles(['INSTRUCTOR'])).toBeUndefined()
  })
})
