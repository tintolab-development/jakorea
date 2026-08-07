import { describe, expect, it } from 'vitest'
import { resolveInstructorMemberProfile } from './resolve-instructor-member-profile'

describe('resolveInstructorMemberProfile', () => {
  it('CMS profile memberType SCHOOL_TEACHER이면 school_teacher로 본다', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        instructorCmsProfile: {
          memberType: 'SCHOOL_TEACHER',
          affiliation: { organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
      })
    ).toBe('school_teacher')
  })

  it('목록 metrics 교사 회원 라벨이면 school_teacher로 본다', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        listMetrics: { permissionApplicationTypeLabel: '교사 회원' },
      })
    ).toBe('school_teacher')
  })

  it('프로필이 없고 학교 연결만 있으면 instructor_dual', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        affiliatedSchoolUserId: 'school-1',
      })
    ).toBe('instructor_dual')
  })

  it('CMS SCHOOL_TEACHER + organizationNames이면 instructor_dual', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        instructorCmsProfile: {
          memberType: 'SCHOOL_TEACHER',
          affiliation: { schoolName: 'OO초', organizationNames: ['JA 강사단'] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
      })
    ).toBe('instructor_dual')
  })

  it('교사 회원 라벨 + 학교 연결이면 instructor_dual', () => {
    expect(
      resolveInstructorMemberProfile({
        role: 'INSTRUCTOR',
        affiliatedSchoolUserId: 'school-1',
        listMetrics: { permissionApplicationTypeLabel: '교사 회원' },
      })
    ).toBe('instructor_dual')
  })

  it('그 외 INSTRUCTOR는 instructor_only', () => {
    expect(resolveInstructorMemberProfile({ role: 'INSTRUCTOR' })).toBe('instructor_only')
  })
})
