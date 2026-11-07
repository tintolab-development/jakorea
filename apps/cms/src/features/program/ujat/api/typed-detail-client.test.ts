import { describe, expect, it } from 'vitest'
import {
  applyUjatProgramPatchToTypedDetail,
  stripUjatTypedLegacyOverlay,
  typedDetailFromUjatBasicInfo,
  typedDetailFromUjatOverlay,
  ujatOverlayFromTypedDetail,
} from './typed-detail-client'

describe('UJAT typed detail migration boundary', () => {
  it('legacy schedule and survey overlay becomes a versioned typed document', () => {
    const typed = typedDetailFromUjatOverlay({
      'ujat.h1.event.name': '상반기 본교육',
      'ujat.h1.event.delivery': 'offline',
      'ujat.h1.event.range': { start: '2027-04-01', end: '2027-04-30' },
      'ujat.h1.event.scheduleIds': [101, 102],
      'ujat.basicInfo.surveyItems': {
        survey: true,
        volunteer_satisfaction: false,
        school_satisfaction: true,
        lecture_evaluation: false,
      },
      'ujat.basicInfo.participant.organization': true,
      'ujat.basicInfo.participant.volunteer': false,
    })

    expect(typed.schemaVersion).toBe(1)
    expect(typed.halfPlans?.[0]?.stages?.[0]).toMatchObject({
      stage: 'MAIN_EDUCATION',
      rows: [
        expect.objectContaining({
          educationName: '상반기 본교육',
          scheduleIds: [101, 102],
          startDate: '2027-04-01',
          endDate: '2027-04-30',
        }),
      ],
    })
    expect(typed.common?.surveySettings).toEqual([
      { surveyType: 'SURVEY', enabled: true },
      { surveyType: 'VOLUNTEER_SATISFACTION', enabled: false },
      { surveyType: 'SCHOOL_SATISFACTION', enabled: true },
      { surveyType: 'LECTURE_EVALUATION', enabled: false },
    ])
    expect(typed.common?.participantSettings).toEqual({
      individual: null,
      organization: true,
      teacher: null,
      volunteer: false,
    })
  })

  it('진행불가일은 excludeHoliday로만 직렬화하고 KST Instant 날짜를 YYYY-MM-DD로 보낸다', () => {
    const typed = typedDetailFromUjatOverlay({
      'ujat.h1.event.name': '상반기 본교육',
      'ujat.h1.event.delivery': 'offline',
      'ujat.h1.event.range': {
        start: '2027-03-08T15:00:00.000Z',
        end: '2027-03-08T15:00:00.000Z',
      },
      'ujat.h1.eduSchedule.exclusion': { excludeHoliday: true, excludeSaturday: true },
    })
    const row = typed.halfPlans?.[0]?.stages?.[0]?.rows?.[0]
    expect(row?.startDate).toBe('2027-03-09')
    expect(row?.endDate).toBe('2027-03-09')
    expect(row?.exclusion).toEqual({
      excludeNone: false,
      excludeSaturday: true,
      excludeSunday: false,
      excludeHoliday: true,
    })
    expect(JSON.stringify(row?.exclusion)).not.toContain('excludePublicHoliday')
  })

  it('typed values are projected to the legacy UI model for the migration window', () => {
    const overlay = ujatOverlayFromTypedDetail({
      schemaVersion: 1,
      halfPlans: [
        {
          semesterType: 'SECOND_HALF',
          stages: [
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                {
                  rowId: 'h2-main-1',
                  displayOrder: 1,
                  educationName: '하반기 본교육',
                  educationMethod: 'online',
                  startDate: '2027-10-01',
                  endDate: '2027-10-31',
                  scheduleIds: [202],
                },
              ],
            },
          ],
        },
      ],
      common: {
        surveySettings: [{ surveyType: 'SURVEY', enabled: false }],
        participantSettings: { organization: true, volunteer: false },
      },
    })

    expect(overlay['ujat.h2.event.name']).toBe('하반기 본교육')
    expect(overlay['ujat.h2.event.range']).toEqual({
      start: '2027-10-01',
      end: '2027-10-31',
    })
    expect(overlay['ujat.h2.event.scheduleIds']).toEqual([202])
    expect(overlay['ujat.basicInfo.surveyItems']).toEqual({ survey: false })
    expect(overlay['ujat.basicInfo.participant.organization']).toBe(true)
    expect(overlay['ujat.basicInfo.participant.volunteer']).toBe(false)
  })

  it('removes only typed-owned legacy keys and keeps recruitment compatibility data', () => {
    const stripped = stripUjatTypedLegacyOverlay({
      'ujat.basicInfo.repKo': '대표명',
      'ujat.h1.event.name': '본교육',
      'ujat.kpi.participantCount': 10,
      'ujat.recruit.institution.publicTitle': '기관 모집 공고',
      'ujat.wage.paymentItemValues': [],
      other: false,
    })

    expect(stripped).toEqual({
      'ujat.recruit.institution.publicTitle': '기관 모집 공고',
      other: false,
    })
  })

  it('does not replace omitted boolean fields with false when merging legacy values', () => {
    const typed = typedDetailFromUjatOverlay(
      {
        'ujat.basicInfo.participant.organization': false,
        'ujat.basicInfo.surveyItems': { survey: false },
      },
      {
        schemaVersion: 1,
        halfPlans: [],
        common: {
          surveySettings: [
            { surveyType: 'SURVEY', enabled: true },
            { surveyType: 'LECTURE_EVALUATION', enabled: true },
          ],
          participantSettings: { organization: true, volunteer: true },
        },
      }
    )

    expect(typed.common?.surveySettings).toEqual([
      { surveyType: 'SURVEY', enabled: false },
      { surveyType: 'VOLUNTEER_SATISFACTION', enabled: null },
      { surveyType: 'SCHOOL_SATISFACTION', enabled: null },
      { surveyType: 'LECTURE_EVALUATION', enabled: true },
    ])
    expect(typed.common?.participantSettings).toEqual({
      individual: null,
      organization: false,
      teacher: null,
      volunteer: true,
    })
  })

  it('keeps explicit UJAT survey and participant PATCH values in the typed document', () => {
    const next = applyUjatProgramPatchToTypedDetail(
      {
        schemaVersion: 1,
        common: {
          surveySettings: [{ surveyType: 'SURVEY', enabled: true }],
          participantSettings: { organization: true, volunteer: true },
        },
      },
      {
        generalSurveyMenuKeys: ['school_satisfaction'],
        generalParticipantTypes: ['organization'],
      }
    )

    expect(next.common?.surveySettings).toEqual([
      { surveyType: 'SURVEY', enabled: false },
      { surveyType: 'VOLUNTEER_SATISFACTION', enabled: false },
      { surveyType: 'SCHOOL_SATISFACTION', enabled: true },
      { surveyType: 'LECTURE_EVALUATION', enabled: false },
    ])
    expect(next.common?.participantSettings).toEqual({
      individual: false,
      organization: true,
      teacher: false,
      volunteer: false,
    })
  })

  it('builds survey and participant settings from the typed RHF snapshot', () => {
    const typed = typedDetailFromUjatBasicInfo({
      surveySurvey: false,
      surveyVolunteerSatisfaction: true,
      surveySchoolSatisfaction: false,
      surveyLectureEvaluation: true,
      generalParticipantTypes: ['school_institution', 'volunteer'],
    })

    expect(typed.common?.surveySettings).toEqual([
      { surveyType: 'SURVEY', enabled: false },
      { surveyType: 'VOLUNTEER_SATISFACTION', enabled: true },
      { surveyType: 'SCHOOL_SATISFACTION', enabled: false },
      { surveyType: 'LECTURE_EVALUATION', enabled: true },
    ])
    expect(typed.common?.participantSettings).toEqual({
      individual: false,
      organization: true,
      teacher: false,
      volunteer: true,
    })
  })
})
