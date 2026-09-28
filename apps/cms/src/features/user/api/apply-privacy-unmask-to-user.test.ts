import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { applyPrivacyUnmaskResponseToUser } from './apply-privacy-unmask-to-user'

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
})
