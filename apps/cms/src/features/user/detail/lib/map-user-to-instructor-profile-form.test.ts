import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { mapUserToInstructorProfileFormValues } from './map-user-to-instructor-profile-form'

describe('mapUserToInstructorProfileFormValues', () => {
  it('자택 주소와 상세 주소를 수정 폼 필드에 분리한다', () => {
    const user: Omit<User, 'password'> = {
      id: 'u-1',
      memberId: 1,
      email: 'a@b.com',
      name: '김강사',
      role: 'INSTRUCTOR',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      detailAddress: '경기도 고양시 덕양구 무원로 1 (행신동)',
      detailAddressDetail: '현소네',
    }

    const values = mapUserToInstructorProfileFormValues(user, null)

    expect(values.homeAddress).toBe('경기도 고양시 덕양구 무원로 1 (행신동)')
    expect(values.homeAddressDetail).toBe('현소네')
  })

  it('교사 회원은 instructorCmsProfile.affiliation.schoolName을 schoolName에 매핑한다', () => {
    const user: Omit<User, 'password'> = {
      id: 'u-1',
      memberId: 1,
      email: 'a@b.com',
      name: '김교사',
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'school_teacher',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      instructorCmsProfile: {
        memberType: 'SCHOOL_TEACHER',
        affiliation: { schoolName: '진월초등학교', employmentStatus: 'ACTIVE', organizationNames: [] },
        homeAddress: { line: '' },
        education: {},
        career: { level: 'experienced', rows: [] },
        jaKoreaActivities: [],
        licenses: [],
        awards: [],
        essays: {},
      },
    }

    const values = mapUserToInstructorProfileFormValues(user, null)

    expect(values.memberType).toBe('school_teacher')
    expect(values.schoolName).toBe('진월초등학교')
    expect(values.employmentStatus).toBe('ACTIVE')
  })
})
