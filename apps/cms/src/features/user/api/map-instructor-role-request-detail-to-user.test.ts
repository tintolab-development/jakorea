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
            agreedAt: '2026-03-01T09:15:42Z',
            consentRecordId: 81,
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
        agreedAt: '2026-03-01T09:15:42Z',
        consentRecordId: 81,
      },
    ])
  })

  it('unmask 원문 phone/email을 User에 반영한다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 163243,
      memberId: 163243,
      status: 'PENDING',
      name: '강사',
      phone: '01082168216',
      email: 'instructor02.dev@jakorea.org',
      privacyMaskingLevel: 'UNMASKED',
    })
    expect(user.phone).toBe('01082168216')
    expect(user.email).toBe('instructor02.dev@jakorea.org')
  })

  it('등급·신청일·승인일을 매핑한다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 172002,
      memberId: 172102,
      status: 'APPROVED',
      requestedAt: '2026-03-01T00:00:00Z',
      decidedAt: '2026-08-10T09:00:00Z',
      name: '승인자',
      profile: {
        memberType: 'GENERAL',
        defaultFeeGrade: 'GRADE_2',
        defaultJaGrade: 'JA_A',
      },
      termsAgreements: [
        {
          termsType: 'FACILITATOR_PLEDGE',
          version: '1.0',
          required: false,
          agreed: true,
        },
      ],
    })

    expect(user.createdAt).toBe('2026-03-01T00:00:00Z')
    expect(user.updatedAt).toBe('2026-08-10T09:00:00Z')
    expect(user.permissionApprovalHandledAt).toBe('2026-08-10T09:00:00Z')
    expect(user.listMetrics?.instructorFeeGradeLabel).toBe('2급 강사비')
    expect(user.listMetrics?.jaEvaluationGrade).toBe('JA_A')
    expect(user.termsAgreements?.[0]).toEqual({
      termsType: 'FACILITATOR_PLEDGE',
      termsVersion: '1.0',
      required: false,
      agreed: true,
    })
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
    expect(user.termsAgreements).toHaveLength(4)
    expect(user.instructorSelfIntroduction).toBe('지원동기 본문')
  })

  it('교사 신청자는 강사 신청 상세용 instructor_dual + 재직 현황을 매핑한다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 172010,
      memberId: 172110,
      status: 'PENDING',
      name: '김지이',
      profile: {
        memberType: 'SCHOOL_TEACHER',
        affiliation: {
          schoolName: '제이에초등학교',
          employmentStatus: 'ACTIVE',
        },
      },
    })

    expect(user.instructorMemberProfile).toBe('instructor_dual')
    expect(user.listMetrics?.employmentStatusLabel).toBe('재직 중')
  })

  it('승인 알림 CASE·상태·시각을 상세 루트에서 매핑한다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 180001,
      memberId: 180101,
      status: 'APPROVED',
      name: '김제이',
      approvalNotificationCase: 'CASE_2',
      approvalNotificationState: 'UNKNOWN',
      approvalNotificationScheduledAt: '2026-11-02T01:00:00.000Z',
      approvalNotificationSentAt: '2026-11-01T01:00:00.000Z',
    })

    expect(user.approvalNotificationCase).toBe('CASE_2')
    expect(user.approvalNotificationState).toBe('UNKNOWN')
    expect(user.approvalNotificationScheduledAt).toBe('2026-11-02T01:00:00.000Z')
    expect(user.approvalNotificationSentAt).toBe('2026-11-01T01:00:00.000Z')
  })

  it('승인 알림 CASE가 없으면 필드를 넣지 않는다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 180002,
      memberId: 180102,
      status: 'APPROVED',
      name: '김제이',
    })
    expect(user.approvalNotificationCase).toBeUndefined()
  })

  it('REVOKED 신청은 강사 권한 회수 상태로 매핑한다', () => {
    const user = mapInstructorRoleRequestDetailToUser({
      requestId: 180003,
      memberId: 180103,
      status: 'REVOKED',
      name: '김제이',
    })
    expect(user.permissionApprovalStatus).toBe('REJECTED')
    expect(user.instructorApprovalStatus).toBe('REVOKED')
  })
})
