import { describe, expect, it } from 'vitest'
import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { hydrateOrganizationApplicationRowFromForm } from './organization-application-form-adapters'

const baseRow: ApplicantSchoolRow = {
  id: '1691183',
  no: 1,
  schoolName: '부산 미래고',
  region: '',
  educationGrade: '',
  classCount: 2,
  studentCount: 40,
  teacherName: '김교사',
  approvalStatus: 'approved',
  programId: '168004',
}

function formWithAnswers(
  answers: NonNullable<FormResponseResponse['answers']>
): FormResponseResponse {
  return {
    formResponseId: 1,
    answers,
  }
}

describe('hydrateOrganizationApplicationRowFromForm', () => {
  it('maps seed answer keys into detail fields and admin comment', () => {
    const form = formWithAnswers([
      {
        questionKeySnapshot: 'textbookName',
        answerDisplayText: '경제야 놀자',
      },
      {
        questionKeySnapshot: 'applicationGrade',
        answerDisplayText: '고2',
      },
      {
        questionKeySnapshot: 'organizationRegion',
        answerDisplayText: '부산',
      },
      {
        questionKeySnapshot: 'addressDetail',
        answerDisplayText: '해운대구 우동 1',
      },
      {
        questionKeySnapshot: 'applicationReason',
        answerDisplayText: '경제교육 필요',
      },
      {
        questionKeySnapshot: 'otherRequests',
        answerDisplayText: '주차 협조',
      },
      {
        questionKeySnapshot: 'computerAvailability',
        answerDisplayText: 'PC 있음',
      },
      {
        questionKeySnapshot: 'waitingAreaGuide',
        answerDisplayText: '교무실 앞',
      },
      {
        questionKeySnapshot: 'mealGuide',
        answerDisplayText: '교내 식당 가능',
      },
      {
        questionKeySnapshot: 'otherNotes',
        answerDisplayText: '정문 주차',
      },
      {
        questionKeySnapshot: 'program-application-institution-seed-sex-offense-consent-submission',
        answerDisplayText: '성범죄 조회 요청 완료',
      },
      {
        questionKeySnapshot: 'desiredEducationDate',
        answerDisplayText: '2026.03.10(화) 오전',
      },
    ])

    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: baseRow,
      formResponse: form,
      adminComment: 'Org Primary QA 코멘트',
    })

    expect(hydrated.educationGrade).toBe('고2')
    expect(hydrated.region).toBe('부산')
    expect(hydrated.adminComment).toBe('Org Primary QA 코멘트')
    expect(hydrated.detail?.textbookName).toBe('경제야 놀자')
    expect(hydrated.detail?.addressDetail).toBe('해운대구 우동 1')
    expect(hydrated.detail?.applicationReason).toBe('경제교육 필요')
    expect(hydrated.detail?.otherRequests).toBe('주차 협조')
    expect(hydrated.detail?.computerInSpace).toBe('PC 있음')
    expect(hydrated.detail?.waitingPlaceGuide).toBe('교무실 앞')
    expect(hydrated.detail?.mealInfo).toBe('교내 식당 가능')
    expect(hydrated.detail?.otherSpecialNotes).toBe('정문 주차')
    expect(hydrated.detail?.sexOffenseCheckRequest).toBe('성범죄 조회 요청 완료')
    expect(hydrated.sessions?.[0]?.date).toBe('2026.03.10(화) 오전')
  })

  it('fills empty list grade from institution basic-info nested JSON', () => {
    const form = formWithAnswers([
      {
        questionKeySnapshot: 'program-application-institution-seed-basic-info',
        answerValueJson: JSON.stringify({
          schoolName: '부명초등학교',
          applicationGrade: '1',
          educationGrade: '1',
        }),
      },
    ])
    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: { ...baseRow, educationGrade: '' },
      formResponse: form,
    })
    expect(hydrated.educationGrade).toBe('1학년')
  })

  it('keeps list grade/address/teacher and fills empty reason from nested basic-info', () => {
    const form = formWithAnswers([
      {
        questionKeySnapshot: 'program-application-trained-teachers-seed-basic-info',
        answerDisplayText: '{schoolName=서울초, applicationGrade=2, applicationReason=사유}',
        answerValueJson: JSON.stringify({
          applicationGrade: '2',
          addressDetail: '3층 교무실',
          applicationReason: '금융 교육',
          otherRequests: '주차',
          teacherName: '이건희',
          teacherMobile: '010-****-9470',
          teacherEmail: '2k***@tinto.co.kr',
        }),
      },
    ])
    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: { ...baseRow, educationGrade: '3~6학년', detail: { addressDetail: '본관' } },
      formResponse: form,
    })
    expect(hydrated.educationGrade).toBe('3~6학년')
    expect(hydrated.detail?.addressDetail).toBe('본관')
    expect(hydrated.detail?.applicationReason).toBe('금융 교육')
    expect(hydrated.detail?.otherRequests).toBe('주차')
    expect(hydrated.detail?.teacherEmail).toBeUndefined()
    expect(hydrated.teacherName).toBe('김교사')
  })

  it('maps Platform nested economy guidance and sex-offense answers', () => {
    const form = formWithAnswers([
      {
        questionKeySnapshot: 'program-application-economy-seed-guidance',
        answerValueJson: JSON.stringify({
          'computer-in-room': '노트북 2대',
          'waiting-place': '본관 2층 연구실',
          meal: '급식실 이용 가능',
          'other-notes': '정문 주차',
        }),
      },
      {
        questionKeySnapshot: 'program-application-economy-seed-sex-offense-consent-submission',
        answerValueJson: JSON.stringify({ submissionRequest: 'request' }),
      },
      {
        questionKeySnapshot: 'program-application-economy-seed-sex-offense-consent-inquiry',
        answerValueJson: JSON.stringify({
          inquiryMethod: 'ja_system',
          siteSubmission: 'direct',
        }),
      },
    ])
    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: baseRow,
      formResponse: form,
    })
    expect(hydrated.detail?.computerInSpace).toBe('노트북 2대')
    expect(hydrated.detail?.waitingPlaceGuide).toBe('본관 2층 연구실')
    expect(hydrated.detail?.mealInfo).toBe('급식실 이용 가능')
    expect(hydrated.detail?.otherSpecialNotes).toBe('정문 주차')
    expect(hydrated.detail?.sexOffenseCheckRequest).toBe(
      '동의서 제출 요청 | JA 시스템 내에서 동의서 확인 | 직접 제출'
    )
  })

  it('fills empty previous-year and affiliated company from economy form answers', () => {
    const form = formWithAnswers([
      {
        questionKeySnapshot: 'previousYearParticipation',
        answerDisplayText: 'yes',
      },
      {
        questionKeySnapshot: 'program-application-economy-seed-lesson-reply',
        answerValueJson: JSON.stringify({
          companyType: 'partner',
          customCompanyName: '우리은행',
        }),
      },
    ])
    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: baseRow,
      formResponse: form,
    })
    expect(hydrated.detail?.previousYearParticipation).toBe('참여')
    expect(hydrated.detail?.affiliatedFinancialCompany).toBe('우리은행')
  })

  it('keeps list DTO fields when form answers are empty', () => {
    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: { ...baseRow, region: '서울', educationGrade: '중1' },
      formResponse: formWithAnswers([]),
    })
    expect(hydrated.region).toBe('서울')
    expect(hydrated.educationGrade).toBe('중1')
    expect(hydrated.schoolName).toBe('부산 미래고')
  })

  it('does not resurrect cleared canonical fields from the original form response', () => {
    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: { ...baseRow, detail: { applicationReason: '현재 행의 이전 값' } },
      formResponse: formWithAnswers([
        { questionKeySnapshot: 'applicationReason', answerDisplayText: '최초 신청 사유' },
        { questionKeySnapshot: 'otherRequests', answerDisplayText: '최초 요청사항' },
        { questionKeySnapshot: 'computerAvailability', answerDisplayText: '최초 안내' },
        { questionKeySnapshot: 'previousYearParticipation', answerDisplayText: 'yes' },
        { questionKeySnapshot: 'desiredEducationDate', answerDisplayText: '2026.03.10' },
        {
          questionKeySnapshot:
            'program-application-institution-seed-sex-offense-consent-submission',
          answerDisplayText: '성범죄 조회 요청 완료',
        },
      ]),
      canonicalDetail: {
        applicationReason: null,
        otherRequests: null,
        computerInRoom: null,
        previousYearParticipation: null,
        requestedScheduleMemo: null,
        requestedGrade: null,
        requestedClassCount: null,
        requestedStudentCount: null,
      } as unknown as import('@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse').OrganizationApplicationDetailResponse,
    })

    expect(hydrated.detail?.applicationReason).toBeUndefined()
    expect(hydrated.detail?.otherRequests).toBeUndefined()
    expect(hydrated.detail?.computerInSpace).toBeUndefined()
    expect(hydrated.detail?.previousYearParticipation).toBeUndefined()
    expect(hydrated.sessions).toBeUndefined()
    // canonical DTO에 없는 동적 답변은 계속 표시할 수 있다.
    expect(hydrated.detail?.sexOffenseCheckRequest).toBe('성범죄 조회 요청 완료')
  })

  it('does not use form answers when the detail snapshot omits optional fields', () => {
    const hydrated = hydrateOrganizationApplicationRowFromForm({
      row: {
        ...baseRow,
        detail: { educationType: '온라인', applicationReason: '목록 값' },
      },
      formResponse: formWithAnswers([
        { questionKeySnapshot: 'applicationReason', answerDisplayText: '이전 사유' },
        { questionKeySnapshot: 'teacherTel', answerDisplayText: '02-1234-5678' },
        { questionKeySnapshot: 'teacherMobile', answerDisplayText: '010-1111-2222' },
        { questionKeySnapshot: 'computerAvailability', answerDisplayText: 'PC 있음' },
      ]),
      canonicalDetail: {
        // 선택 필드는 JSON에서 생략될 수 있으며, 생략도 상세 정본의 값 없음이다.
        requestedEducationFormat: undefined,
        applicationReason: undefined,
        teacherTel: undefined,
        teacherPhone: undefined,
        computerInRoom: undefined,
      },
    })

    expect(hydrated.detail?.educationType).toBeUndefined()
    expect(hydrated.detail?.applicationReason).toBeUndefined()
    expect(hydrated.detail?.teacherTel).toBeUndefined()
    expect(hydrated.detail?.teacherMobile).toBeUndefined()
    expect(hydrated.detail?.computerInSpace).toBeUndefined()
  })
})
