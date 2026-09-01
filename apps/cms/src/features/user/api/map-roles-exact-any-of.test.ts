import { describe, expect, it } from 'vitest'
import {
  encodeRolesExactAnyOf,
  instructorListRolesExactAnyOf,
  rolesExactAnyOfForAllTabRoleFilter,
  rolesExactAnyOfForDirectoryRoleFilter,
  accountTypeForDirectoryRoleFilter,
} from './map-roles-exact-any-of'

describe('encodeRolesExactAnyOf', () => {
  it('set 내 토큰을 정렬하고 + / , 로 직렬화한다', () => {
    expect(
      encodeRolesExactAnyOf([
        ['instructor', 'general'],
        ['school_teacher', 'instructor'],
      ])
    ).toBe('general+instructor,instructor+school_teacher')
  })
})

describe('instructorListRolesExactAnyOf', () => {
  it('강사 목록 allowlist를 반환한다', () => {
    expect(instructorListRolesExactAnyOf()).toBe(
      'general+instructor,instructor+school_teacher'
    )
  })
})

describe('rolesExactAnyOfForAllTabRoleFilter', () => {
  it('학교 조직 옵션은 무시한다', () => {
    expect(rolesExactAnyOfForAllTabRoleFilter('SCHOOL')).toBeUndefined()
  })

  it('개인 → general', () => {
    expect(rolesExactAnyOfForAllTabRoleFilter('INDIVIDUAL')).toBe('general')
  })

  it('표시 유형과 1:1로 exact set을 매핑한다', () => {
    expect(rolesExactAnyOfForAllTabRoleFilter('SCHOOL_TEACHER')).toBe('school_teacher')
    expect(rolesExactAnyOfForAllTabRoleFilter('INSTRUCTOR')).toBe('general+instructor')
    expect(rolesExactAnyOfForAllTabRoleFilter('INSTRUCTOR_DUAL')).toBe('instructor+school_teacher')
    expect(rolesExactAnyOfForAllTabRoleFilter('INSTRUCTOR_REVOKED')).toBe(
      'general+instructor_revoked,instructor_revoked+school_teacher'
    )
    expect(rolesExactAnyOfForAllTabRoleFilter('ADMIN')).toBe('admin')
  })
})

describe('directory role filter (GET /members/all)', () => {
  it('개인·강사·학교(교사)는 디렉터리 대문자 토큰을 쓴다', () => {
    expect(rolesExactAnyOfForDirectoryRoleFilter('INDIVIDUAL')).toBe('INDIVIDUAL')
    expect(rolesExactAnyOfForDirectoryRoleFilter('SCHOOL_TEACHER')).toBe('SCHOOL_TEACHER')
    expect(rolesExactAnyOfForDirectoryRoleFilter('INSTRUCTOR')).toBe('INSTRUCTOR')
    expect(rolesExactAnyOfForDirectoryRoleFilter('INSTRUCTOR_DUAL')).toBe(
      'INSTRUCTOR+SCHOOL_TEACHER'
    )
  })

  it('관리자는 accountType=ADMIN_ACCOUNT', () => {
    expect(accountTypeForDirectoryRoleFilter('ADMIN')).toBe('ADMIN_ACCOUNT')
    expect(accountTypeForDirectoryRoleFilter('INDIVIDUAL')).toBe('MEMBER')
    expect(accountTypeForDirectoryRoleFilter('ALL')).toBeUndefined()
  })
})
