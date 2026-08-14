import { describe, expect, it } from 'vitest'
import { mapInstructorRoleRequestDetailToUser } from './map-instructor-role-request-detail-to-user'

describe('mapInstructorRoleRequestDetailToUser', () => {
  it('신청 스냅샷·약관·requestId를 User로 매핑한다', () => {
    const user = mapInstructorRoleRequestDetailToUser(
      {
        requestId: 55,
        memberId: 9,
        status: 'PENDING',
        requestedActivityType: 'JA 강사단',
        requestedAt: '2026-03-01T00:00:00Z',
        name: '신청자',
        gender: 'F',
        birthDate: '1994.04.04',
        phone: '010****5124',
        email: 'a***@test.com',
        profile: {
          memberType: 'GENERAL',
          oneLineIntro: '소개',
          homeAddress: { line: '서울' },
        },
        settlement: {
          bankName: '국민',
          accountNumber: '***',
          accountHolder: '신청자',
          businessIncome: false,
          bankAccounts: [
            {
              bankName: '국민',
              accountNumber: '***',
              accountHolder: '신청자',
              current: true,
            },
          ],
        },
        termsAgreements: [
          {
            termsType: 'FACILITATOR_PLEDGE',
            version: '1.0',
            required: false,
            agreed: true,
          },
        ],
      },
      { fallbackId: 'list-user-9' }
    )

    expect(user.id).toBe('list-user-9')
    expect(user.instructorRoleRequestId).toBe(55)
    expect(user.memberId).toBe(9)
    expect(user.role).toBe('INSTRUCTOR')
    expect(user.permissionApprovalStatus).toBe('PENDING')
    expect(user.birthDate).toBe('1994-04-04')
    expect(user.instructorCmsProfile?.oneLineIntro).toBe('소개')
    expect(user.bio).toBe('소개')
    expect(user.instructorCmsSettlement?.bankAccounts?.[0]?.bankName).toBe('국민')
    expect(user.instructorInfo).toEqual({
      bankName: '국민',
      accountNumber: '***',
      accountHolder: '신청자',
      isBusinessIncome: false,
    })
    expect(user.termsAgreements).toEqual([
      {
        termsType: 'FACILITATOR_PLEDGE',
        termsVersion: '1.0',
        required: false,
        agreed: true,
      },
    ])
  })
})
