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
        questionKeySnapshot:
          'program-application-institution-seed-sex-offense-consent-submission',
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

  it('does not fill grade, address, or teacher contact from the TT basic-info form answer', () => {
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
    expect(hydrated.detail?.applicationReason).toBeUndefined()
    expect(hydrated.detail?.otherRequests).toBeUndefined()
    expect(hydrated.detail?.teacherEmail).toBeUndefined()
    expect(hydrated.teacherName).toBe('김교사')
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
})
