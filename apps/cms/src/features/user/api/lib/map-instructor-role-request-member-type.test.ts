import { describe, expect, it } from 'vitest'
import { mapInstructorRoleRequestMemberTypeLabel } from './map-instructor-role-request-member-type'

describe('mapInstructorRoleRequestMemberTypeLabel', () => {
  it('maps BE display labels from list API', () => {
    expect(mapInstructorRoleRequestMemberTypeLabel('개인')).toBe('INDIVIDUAL')
    expect(mapInstructorRoleRequestMemberTypeLabel('학교/기관')).toBe('SCHOOL')
  })

  it('maps enum and legacy aliases', () => {
    expect(mapInstructorRoleRequestMemberTypeLabel('GENERAL')).toBe('INDIVIDUAL')
    expect(mapInstructorRoleRequestMemberTypeLabel('SCHOOL_TEACHER')).toBe('SCHOOL')
    expect(mapInstructorRoleRequestMemberTypeLabel('학교(교사)')).toBe('SCHOOL')
    expect(mapInstructorRoleRequestMemberTypeLabel('강사')).toBe('INSTRUCTOR')
  })

  it('defaults empty/unknown to INDIVIDUAL', () => {
    expect(mapInstructorRoleRequestMemberTypeLabel(undefined)).toBe('INDIVIDUAL')
    expect(mapInstructorRoleRequestMemberTypeLabel('')).toBe('INDIVIDUAL')
    expect(mapInstructorRoleRequestMemberTypeLabel('기타')).toBe('INDIVIDUAL')
  })
})
