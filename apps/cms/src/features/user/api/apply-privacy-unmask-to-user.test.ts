import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { User } from '@/types/user'
import {
  applyPrivacyUnmaskResponseToUser,
  enrichSchoolTeacherAffiliationFromOrganization,
} from './apply-privacy-unmask-to-user'

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchSchoolOrganizationRemote: vi.fn(),
}))

import { fetchSchoolOrganizationRemote } from '@/features/user/api/members-api-client'

function baseInstructorUser(): Omit<User, 'password'> {
  return {
    id: 'qa-roster-06-choi-jiwon',
    memberId: 190006,
    email: 'jiwon94***@tinto.co.kr',
    name: '최지원',
    phone: '010-****-5124',
    role: 'INSTRUCTOR',
    roles: ['INSTRUCTOR'],
    instructorMemberProfile: 'instructor_only',
    isActive: true,
    createdAt: '2026-09-27T23:35:19.605223Z',
    updatedAt: '2026-09-28T02:07:45.501021Z',
    birthDate: '1994-07-22',
    gender: '여성',
    detailAddress: '서울특별시 중구',
    instructorInfo: {
      bankName: '신한은행',
      accountNumber: '************',
      accountHolder: '최**',
      isBusinessIncome: true,
    },
  }
}

function baseSchoolTeacherUser(): Omit<User, 'password'> {
  return {
    id: 'qa-roster-34-teacher-mun-hayoung',
    memberId: 190034,
    email: 'company***@test.com',
    name: '문하영',
    phone: '010-****-9470',
    role: 'INSTRUCTOR',
    roles: ['SCHOOL_TEACHER'],
    instructorMemberProfile: 'school_teacher',
    affiliatedSchoolName: '**초등학교',
    organizationId: 165101,
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    birthDate: '1984-05-20',
    gender: '여성',
  }
}

describe('applyPrivacyUnmaskResponseToUser', () => {
  it('강사 회원 unmask 응답의 member/profile/settlement 원문을 상세 User에 반영한다', () => {
    const merged = applyPrivacyUnmaskResponseToUser(
      baseInstructorUser(),
      {
        member: {
          memberId: 190006,
          uuid: 'qa-roster-06-choi-jiwon',
          email: 'jiwon94k@tinto.co.kr',
          name: '최지원',
          phone: '010-3327-5124',
          birthDate: '1994-07-22',
          birthYear: 1994,
          gender: 'FEMALE',
          status: 'ACTIVE',
          loginEnabled: true,
          identityVerified: true,
          preRegistered: false,
          createdByAdmin: true,
          under14: false,
          guardianConsentRequired: false,
          external1365Id: null,
          roles: ['INSTRUCTOR'],
          joinedAt: '2026-09-27T23:35:19.605223Z',
          createdAt: '2026-09-27T23:35:19.605223Z',
          updatedAt: '2026-09-28T02:07:45.501021Z',
        },
        profile: {
          memberType: 'JA',
          status: 'ACTIVE',
          oneLineIntro: '로컬 QA 강사',
          homeAddress: {
            line: '서울특별시 중구',
          },
          defaultFeeGrade: 'GRADE_1',
          defaultJaGrade: 'A',
        },
        settlement: {
          bankName: '신한은행',
          accountNumber: '110123185222',
          accountHolder: '최지원',
          businessIncome: true,
          bankAccounts: [
            {
              id: 185952,
              bankName: '신한은행',
              accountNumber: '110123185222',
              accountHolder: '최지원',
              current: true,
            },
          ],
        },
        certifications: [],
        termsAgreements: [],
      },
      'INSTRUCTOR'
    )

    expect(merged.email).toBe('jiwon94k@tinto.co.kr')
    expect(merged.phone).toBe('010-3327-5124')
    expect(merged.detailAddress).toBe('서울특별시 중구')
    expect(merged.instructorInfo).toMatchObject({
      bankName: '신한은행',
      accountNumber: '110123185222',
      accountHolder: '최지원',
      isBusinessIncome: true,
    })
  })

  it('순수 교사 — TeacherMemberDetail unmask의 organizationName 원문이 목록 마스킹 소속을 덮는다', () => {
    const merged = applyPrivacyUnmaskResponseToUser(
      baseSchoolTeacherUser(),
      {
        member: {
          memberId: 190034,
          uuid: 'qa-roster-34-teacher-mun-hayoung',
          email: 'company@test.com',
          name: '문하영',
          phone: '01057649470',
          birthDate: '1984-05-20',
          gender: 'FEMALE',
          status: 'ACTIVE',
          roles: ['SCHOOL_TEACHER'],
        },
        organizationId: 165101,
        organizationName: '강서초등학교',
        employmentStatus: 'ACTIVE',
      },
      'INSTRUCTOR'
    )

    expect(merged.email).toBe('company@test.com')
    expect(merged.phone).toBe('01057649470')
    expect(merged.affiliatedSchoolName).toBe('강서초등학교')
    expect(merged.organizationId).toBe(165101)
  })

  it('순수 교사 — MemberDetail unmask에 organizationName만 있어도 마스킹 소속을 원문으로 교체한다', () => {
    const merged = applyPrivacyUnmaskResponseToUser(
      baseSchoolTeacherUser(),
      {
        memberId: 190034,
        uuid: 'qa-roster-34-teacher-mun-hayoung',
        email: 'company@test.com',
        name: '문하영',
        phone: '01057649470',
        organizationName: '강서초등학교',
      },
      'INSTRUCTOR'
    )

    expect(merged.affiliatedSchoolName).toBe('강서초등학교')
  })
})

describe('enrichSchoolTeacherAffiliationFromOrganization', () => {
  beforeEach(() => {
    vi.mocked(fetchSchoolOrganizationRemote).mockReset()
  })

  it('마스킹된 소속이면 organization 상세 name으로 보강한다', async () => {
    vi.mocked(fetchSchoolOrganizationRemote).mockResolvedValue({
      organizationId: 165101,
      name: '강서초등학교',
    })

    const enriched = await enrichSchoolTeacherAffiliationFromOrganization(baseSchoolTeacherUser())

    expect(fetchSchoolOrganizationRemote).toHaveBeenCalledWith(165101)
    expect(enriched.affiliatedSchoolName).toBe('강서초등학교')
  })

  it('이미 원문 소속이면 organization 조회를 하지 않는다', async () => {
    const enriched = await enrichSchoolTeacherAffiliationFromOrganization({
      ...baseSchoolTeacherUser(),
      affiliatedSchoolName: '강서초등학교',
    })

    expect(fetchSchoolOrganizationRemote).not.toHaveBeenCalled()
    expect(enriched.affiliatedSchoolName).toBe('강서초등학교')
  })
})
