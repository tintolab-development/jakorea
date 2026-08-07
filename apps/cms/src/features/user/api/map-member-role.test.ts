import { describe, expect, it } from 'vitest'
import {
  memberRolesIncludeSchool,
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
