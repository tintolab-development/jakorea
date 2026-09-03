import { describe, expect, it } from 'vitest'
import {
  hasIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from './registration-required-fields'

function ctx(
  patch?: Partial<GeneralProgramRegistrationRequiredFieldContext>
): GeneralProgramRegistrationRequiredFieldContext {
  return {
    participant: {
      individual: true,
      organization: false,
      teacherInstructor: false,
      volunteer: false,
    },
    programType: 'curriculum',
    sessionRoundType: 'single',
    educationFormScheduleDetail: 'common',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    curriculumSessionCount: 1,
    curriculumChartSessionCount: 1,
    scheduleCurriculumDetailCount: 1,
    scheduleCurriculumGroupCount: 1,
    scheduleCurriculumPreEducation: false,
    educationScheduleMode: 'date',
    sponsorId: 'sponsor-1',
    sponsorContactId: 'contact-1',
    programTitleKo: '테스트 프로그램',
    ...patch,
  }
}

function filledOverlay(patch?: Record<string, unknown>): Record<string, unknown> {
  return {
    'generalRegistration.basicInfo.programTitleEn': 'Test Program',
    'generalRegistration.basicInfo.publicProgramTitle': '공고용 프로그램',
    'generalRegistration.basicInfo.detailedProgramId': 'detail-1',
    'generalRegistration.basicInfo.operationRangeSeal': {
      start: '2026-03-01T00:00:00.000Z',
      end: '2026-12-31T00:00:00.000Z',
    },
    'generalRegistration.basicInfo.businessField': 'economy',
    'generalRegistration.basicInfo.educationVenueDetail': '본관 3층',
    'generalRegistration.basicInfo.surveyItems': { survey: true, satisfaction: false, lecture_evaluation: false },
    'generalRegistration.basicInfo.educationCourse': 'ja',
    'generalRegistration.basicInfo.ipOwned': 'ja',
    'generalRegistration.basicInfo.courseDeliveredBy': 'ja',
    'generalRegistration.kpi.participantCount': 10,
    'generalRegistration.wageInfo.grade1Fee': 100000,
    'generalRegistration.wageInfo.grade2Fee': 80000,
    'generalRegistration.wageInfo.grade3Fee': 60000,
    'generalRegistration.wageInfo.paymentItemValues': ['instructor_fee'],
    'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
    'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원 1' },
    'generalRegistration.educationCurriculum.unitContentBySession': { 1: '교육 내용' },
    'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-04-01 10:00-12:00'],
    ...patch,
  }
}

describe('hasIncompleteGeneralProgramRegistrationRequiredFields', () => {
  it('빈 overlay면 미완료이다', () => {
    expect(hasIncompleteGeneralProgramRegistrationRequiredFields({}, ctx())).toBe(true)
  })

  it('공통 정보 필수값을 채우면 완료이다', () => {
    expect(hasIncompleteGeneralProgramRegistrationRequiredFields(filledOverlay(), ctx())).toBe(false)
  })

  it('대표 프로그램명(국문)이 비면 미완료이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({ programTitleKo: '   ' })
      )
    ).toBe(true)
  })

  it('강사 KPI는 강사 참여자일 때만 필수이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({
          participant: {
            individual: true,
            organization: false,
            teacherInstructor: true,
            volunteer: false,
          },
        })
      )
    ).toBe(true)
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({ 'generalRegistration.kpi.instructor': 3 }),
        ctx({
          participant: {
            individual: true,
            organization: false,
            teacherInstructor: true,
            volunteer: false,
          },
        })
      )
    ).toBe(false)
  })

  it('설문 진행 항목을 하나도 고르지 않으면 미완료이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.basicInfo.surveyItems': {
            survey: false,
            satisfaction: false,
            lecture_evaluation: false,
          },
        }),
        ctx()
      )
    ).toBe(true)
  })
})
