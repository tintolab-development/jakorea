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

  it('joinedAt·notificationResentAt·등급·social·terms agreedAt를 매핑한다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 172002,
      memberId: 172102,
      status: 'APPROVED',
      requestedAt: '2026-03-01T00:00:00Z',
      joinedAt: '2025-01-15T00:00:00Z',
      decidedAt: '2026-08-10T09:00:00Z',
      notificationResentAt: '2026-08-15T14:30:00Z',
      name: '승인자',
      profile: {
        memberType: 'GENERAL',
        defaultFeeGrade: 'GRADE_2',
        defaultJaGrade: 'JA_A',
      },
      socialAccounts: [{ provider: 'GOOGLE', status: 'CONNECTED' }],
      termsAgreements: [
        {
          termsType: 'FACILITATOR_PLEDGE',
          version: '1.0',
          required: false,
          agreed: true,
          agreedAt: '2026-03-01T01:00:00Z',
        },
      ],
    })

    expect(user.createdAt).toBe('2025-01-15T00:00:00Z')
    expect(user.permissionNotificationResentAt).toBe('2026-08-15T14:30:00Z')
    expect(user.socialAccounts).toEqual(['GOOGLE'])
    expect(user.listMetrics?.instructorFeeGradeLabel).toBeTruthy()
    expect(user.listMetrics?.jaEvaluationGrade).toBe('JA_A')
    expect(user.termsAgreements?.[0]?.agreedAt).toBe('2026-03-01T01:00:00Z')
  })

  it('structured profile(education/career/essays/licenses)를 instructorCmsProfile에 매핑한다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 172001,
      memberId: 172101,
      status: 'PENDING',
      name: '최지원',
      profile: {
        memberType: 'GENERAL',
        education: {
          highestSchoolType: 'college4',
          highestStatus: 'graduated',
        },
        career: { level: 'experienced', rows: [] },
        essays: { freeWrite1: '지원동기 본문' },
        licenses: [{ title: '자격증' }],
        awards: [{ title: '수상' }],
        jaKoreaActivities: [{ title: 'JA' }],
      },
      socialAccounts: [
        { provider: 'KAKAO', status: 'CONNECTED' },
        { provider: 'NAVER', status: 'CONNECTED' },
      ],
      termsAgreements: [
        { termsType: 'FACILITATOR_PLEDGE', agreed: true },
        { termsType: 'PAYMENT_STATEMENT_PRE_CONSENT', agreed: true },
        { termsType: 'ADMINISTRATIVE_INFO_CONSENT', agreed: true },
        { termsType: 'CRIMINAL_HISTORY_CHECK_CONSENT', agreed: true },
      ],
    })

    expect(user.instructorCmsProfile?.education.highestSchoolType).toBe('college4')
    expect(user.instructorCmsProfile?.career.level).toBe('experienced')
    expect(user.instructorCmsProfile?.essays.freeWrite1).toBe('지원동기 본문')
    expect(user.instructorCmsProfile?.licenses).toHaveLength(1)
    expect(user.socialAccounts).toEqual(['KAKAO', 'NAVER'])
    expect(user.termsAgreements).toHaveLength(4)
    expect(user.instructorSelfIntroduction).toBe('지원동기 본문')
  })
})
