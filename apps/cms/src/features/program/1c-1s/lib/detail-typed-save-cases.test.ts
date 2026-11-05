/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import { mapCompanySchoolDetailToProgram, mapCompanySchoolToUpdateRequest } from '@/features/program/1c-1s/api/adapters'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  buildCompanySchoolDetailTypedSave,
  serializeCompanySchoolDetailPatchOverlay,
} from './registration-overlay-sync'

const leftover = {
  'economyRegistration.kpi.volunteer': 9,
  'economyRegistration.kpi.educationProgress.note': '',
  'application.instructor.memo': 'keep',
  'recruit.notes': '기관 비고',
  'instructorRecruit.notes': '강사 비고',
  'economyRegistration.basicInfo.publicProgramTitle': '옛 공고',
}

function typedProgram(): Program {
  return {
    id: '186920',
    backendProgramType: 'COMPANY_SCHOOL',
    sponsorId: 'sponsor-cs',
    title: '최신 제목',
    mainTitle: '최신 제목',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-03-01',
    endDate: '2026-11-30',
    status: 'pending',
    rounds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    generalSurveyMenuKeys: ['survey'],
    generalCommonInfo: {
      announcementTitle: '최신 공고',
      paymentItems: '교통비(일사일교), 숙박비(일사일교)',
      curriculumSessions: [
        { sessionLabel: '1차시', title: '유지 제목', description: '유지 설명' },
        { sessionLabel: '2차시', title: '2제목', description: '2설명' },
      ],
      kpi: {
        finalParticipants: 3,
        instructorCount: 1,
        volunteerCount: 0,
        finalSchools: 2,
        finalClasses: 4,
      },
      participantRecruitmentInfo: {
        contactOrganizationName: '기관 담당',
        remarks: '기관 비고',
      },
      instructorRecruitmentInfo: {
        contactOrganizationName: '강사 담당',
        remarks: '강사 비고',
      },
    },
    registrationOverlay: leftover,
  }
}

describe('STEP 3.2 typed detail save cases', () => {
  it('CASE A Typed 입력 우선: GET 공고명이 옛 overlay 공고명보다 PATCH에 실린다', () => {
    const program = typedProgram()
    const values = programToDetailEditValues(program)
    values.announcementTitle = 'Typed 수정 공고'
    const built = buildCompanySchoolDetailTypedSave({ program, values })
    expect(built.registrationOverlay['economyRegistration.basicInfo.publicProgramTitle']).toBe(
      'Typed 수정 공고'
    )
    expect(built.draft.generalCommonInfo?.announcementTitle).toBe('Typed 수정 공고')
  })

  it('CASE B 기관 leftover만 바꿔도 강사·신청 sidecar가 유지된다', () => {
    const overlay = serializeCompanySchoolDetailPatchOverlay({
      typedProgram: typedProgram(),
      leftoverOverlay: leftover,
      liveOverlay: { 'recruit.notes': '기관 수정' },
    })
    expect(overlay['recruit.notes']).toBe('기관 수정')
    expect(overlay['instructorRecruit.notes']).toBe('강사 비고')
    expect(overlay['application.instructor.memo']).toBe('keep')
    expect(overlay['economyRegistration.kpi.volunteer']).toBe(9)
  })

  it('CASE C 강사 leftover만 바꿔도 기관·공통 sidecar가 유지된다', () => {
    const overlay = serializeCompanySchoolDetailPatchOverlay({
      typedProgram: typedProgram(),
      leftoverOverlay: leftover,
      liveOverlay: { 'instructorRecruit.notes': '강사 수정' },
    })
    expect(overlay['instructorRecruit.notes']).toBe('강사 수정')
    expect(overlay['recruit.notes']).toBe('기관 비고')
    expect(overlay['economyRegistration.kpi.educationProgress.note']).toBe('')
    const request = mapCompanySchoolToUpdateRequest(typedProgram(), {
      generalCommonInfo: {
        instructorRecruitmentInfo: { remarks: '강사 수정' },
      },
    })
    expect(JSON.stringify(request)).not.toContain('applicationStartDate')
  })

  it('CASE D 필수 공고명·회차 제목·지급항목 비우기는 저장 차단, 설문 []는 허용', () => {
    const program = typedProgram()
    const blockedAnnouncement = buildCompanySchoolDetailTypedSave({
      program,
      values: { ...programToDetailEditValues(program), announcementTitle: '' },
    })
    expect(blockedAnnouncement.incomplete).toContain('basicInfo.publicProgramTitle')

    const blockedTitle = buildCompanySchoolDetailTypedSave({
      program,
      values: {
        ...programToDetailEditValues(program),
        curriculumSession1Title: '',
      },
    })
    expect(blockedTitle.incomplete.some(key => key.includes('curriculum.session1.title'))).toBe(true)

    const blockedPayment = buildCompanySchoolDetailTypedSave({
      program,
      values: { ...programToDetailEditValues(program), wagePaymentItemIds: [] },
    })
    expect(blockedPayment.incomplete).toContain('wage.paymentItemValues')

    const surveyOk = buildCompanySchoolDetailTypedSave({
      program,
      values: {
        ...programToDetailEditValues(program),
        surveySurvey: false,
        surveySatisfaction: false,
        surveyLectureEvaluation: false,
      },
    })
    expect(surveyOk.incomplete).not.toContain('basicInfo.surveyItems')
    expect(surveyOk.draft.generalSurveyMenuKeys ?? []).toEqual([])
  })

  it('CASE E 부분 PATCH: 공고명만 바꿔도 지급항목·sidecar가 유지된다', () => {
    const program = typedProgram()
    const built = buildCompanySchoolDetailTypedSave({
      program,
      values: { ...programToDetailEditValues(program), announcementTitle: '부분 공고' },
    })
    const request = mapCompanySchoolToUpdateRequest(built.draft, built.patch)
    expect(request).not.toHaveProperty('applicationStartDate')
    expect(built.registrationOverlay['economyRegistration.kpi.volunteer']).toBe(9)
    expect(built.registrationOverlay['application.instructor.memo']).toBe('keep')
  })

  it('CASE F Legacy overlay-only GET 후 수정해도 sidecar와 공고가 남는다', () => {
    const loaded = mapCompanySchoolDetailToProgram({
      id: '186921',
      title: '컬럼 제목',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {},
        registration: { overlay: leftover },
      }),
    } as ProgramResponse)
    const values = programToDetailEditValues(loaded)
    values.announcementTitle = '레거시 수정 공고'
    const built = buildCompanySchoolDetailTypedSave({ program: loaded, values })
    expect(built.draft.generalCommonInfo?.announcementTitle).toBe('레거시 수정 공고')
    expect(built.registrationOverlay['application.instructor.memo']).toBe('keep')
    expect(built.registrationOverlay['economyRegistration.kpi.volunteer']).toBe(9)
  })

  it('CASE G unknown sidecar 빈 문자열과 memo를 유지한다', () => {
    const overlay = serializeCompanySchoolDetailPatchOverlay({
      typedProgram: typedProgram(),
      leftoverOverlay: leftover,
    })
    expect(overlay['economyRegistration.kpi.educationProgress.note']).toBe('')
    expect(overlay['application.instructor.memo']).toBe('keep')
    expect(overlay['economyRegistration.kpi.volunteer']).toBe(9)
  })
})
