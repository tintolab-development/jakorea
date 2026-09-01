import { describe, expect, it } from 'vitest'
import {
  affiliationAndGradeView,
  resolveInstructorAffiliationParts,
  resolveSchoolTeacherAffiliationDisplay,
} from '@/features/user/detail/ui/user-basic-info/display'
import type { User } from '@/types/user'

function instructor(partial: Partial<Omit<User, 'password'>>): Omit<User, 'password'> {
  return {
    id: 'u1',
    email: 'a@b.c',
    name: '강사',
    role: 'INSTRUCTOR',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('resolveSchoolTeacherAffiliationDisplay', () => {
  it('instructorCmsProfile.affiliation.schoolName과 listMetrics 학년을 사용한다', () => {
    const parts = resolveSchoolTeacherAffiliationDisplay(
      instructor({
        instructorMemberProfile: 'school_teacher',
        instructorCmsProfile: {
          memberType: 'SCHOOL_TEACHER',
          affiliation: { schoolName: '진월초등학교', organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
        listMetrics: { instructorAssignedGrade: '3학년' },
      })
    )
    expect(parts).toEqual({ school: '진월초등학교', grade: '3학년' })
  })

  it('affiliation pipe의 학년 세그먼트를 fallback으로 파싱한다', () => {
    const parts = resolveSchoolTeacherAffiliationDisplay(
      instructor({
        affiliation: '진월초등학교 | 5학년 담임',
      })
    )
    expect(parts).toEqual({ school: '진월초등학교', grade: '5학년 담임' })
  })
})

describe('affiliationAndGradeView', () => {
  it('학교·학년이 있으면 TdDivider로 연결한다', () => {
    const view = affiliationAndGradeView(
      instructor({
        affiliatedSchoolName: '진월초등학교',
        listMetrics: { instructorAssignedGrade: '2학년' },
      })
    )
    expect(view).not.toBe('-')
  })

  it('CMS profile 소속만 있어도 학교명을 노출한다', () => {
    const view = affiliationAndGradeView(
      instructor({
        instructorCmsProfile: {
          memberType: 'SCHOOL_TEACHER',
          affiliation: { schoolName: 'OO초등학교', organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
      })
    )
    expect(view).toBe('OO초등학교')
  })
})

describe('resolveInstructorAffiliationParts', () => {
  it('학교·JA 강사단을 분리하고 중복을 제거한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        affiliatedSchoolName: '진월초등학교',
        affiliation: '진월초등학교, 제미나이 강사단',
        listMetrics: { permissionApplicationTypeLabel: '제미나이 강사단' },
      })
    )
    expect(parts.schoolName).toBe('진월초등학교')
    expect(parts.others).toEqual(['제미나이 강사단'])
  })

  it('소속이 여러 개면 콤마로 파싱한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        affiliation: 'OO초등학교, JA 강사단',
      })
    )
    expect(parts.schoolName).toBeUndefined()
    expect(parts.others).toEqual(['OO초등학교', 'JA 강사단'])
  })

  it('affiliation의 직책(| 뒤)은 소속명에서 제외한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        affiliatedSchoolName: '진월초등학교',
        affiliation: '경제교육연구소 | 수석강사',
      })
    )
    expect(parts.schoolName).toBe('진월초등학교')
    expect(parts.others).toEqual(['경제교육연구소'])
  })

  it('instructorCmsProfile.affiliation.schoolName을 학교명 fallback으로 사용한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        instructorCmsProfile: {
          memberType: 'SCHOOL_TEACHER',
          affiliation: { schoolName: '진월초등학교', organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
      })
    )
    expect(parts.schoolName).toBe('진월초등학교')
  })

  it('CMS profile organizationNames를 일반 강사 소속으로 노출한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        instructorMemberProfile: 'instructor_only',
        instructorCmsProfile: {
          memberType: 'GENERAL',
          affiliation: { organizationNames: ['JA 강사단'] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
      })
    )
    expect(parts.schoolName).toBeUndefined()
    expect(parts.others).toEqual(['JA 강사단'])
  })

  it('등록 affiliation의 강사 경력 pipe segment는 소속에서 제외한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        instructorMemberProfile: 'instructor_only',
        affiliation: '10 | JA 강사단',
      })
    )
    expect(parts.others).toEqual(['JA 강사단'])
  })

  it('교사 겸 강사는 CMS profile 학교와 organizationNames를 함께 노출한다', () => {
    const parts = resolveInstructorAffiliationParts(
      instructor({
        instructorMemberProfile: 'instructor_dual',
        affiliatedSchoolName: '진월초등학교',
        instructorCmsProfile: {
          memberType: 'SCHOOL_TEACHER',
          affiliation: {
            schoolName: '진월초등학교',
            organizationNames: ['제미나이 강사단'],
          },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
      })
    )
    expect(parts.schoolName).toBe('진월초등학교')
    expect(parts.others).toEqual(['제미나이 강사단'])
  })
})
