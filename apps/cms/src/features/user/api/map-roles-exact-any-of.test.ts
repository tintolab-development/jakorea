import { describe, expect, it } from 'vitest'
import {
  encodeRolesExactAnyOf,
  instructorListRolesExactAnyOf,
  rolesExactAnyOfForAllTabRoleFilter,
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
})
