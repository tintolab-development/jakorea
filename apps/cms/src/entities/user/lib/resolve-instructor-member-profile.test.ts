import { describe, expect, it } from 'vitest'
import { resolveInstructorMemberProfile } from './resolve-instructor-member-profile'

describe('resolveInstructorMemberProfile', () => {
  it('roles SCHOOL_TEACHER 단독이면 저장된 dual·학교 소속과 무관하게 교사다', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        roles: ['SCHOOL_TEACHER'],
        instructorMemberProfile: 'instructor_dual',
      })
    ).toBe('school_teacher')
  })

  it('roles INSTRUCTOR+SCHOOL_TEACHER이면 겸직이다', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        roles: ['INSTRUCTOR', 'SCHOOL_TEACHER'],
      })
    ).toBe('instructor_dual')
  })

  it('roles INSTRUCTOR_REVOKED는 강사·겸직 상세를 유지한다', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        roles: ['INSTRUCTOR_REVOKED'],
      })
    ).toBe('instructor_only')
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        roles: ['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'],
      })
    ).toBe('instructor_dual')
  })

  it('roles INSTRUCTOR 단독이면 instructor_only다', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        roles: ['INSTRUCTOR'],
        instructorMemberProfile: 'school_teacher',
      })
    ).toBe('instructor_only')
  })

  it('roles가 없으면 저장된 instructorMemberProfile을 쓴다', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'school_teacher',
      })
    ).toBe('school_teacher')
  })

  it('roles·프로필이 없으면 instructor_only다', () => {
    expect(resolveInstructorMemberProfile({ role: 'INSTRUCTOR' })).toBe('instructor_only')
  })
})
