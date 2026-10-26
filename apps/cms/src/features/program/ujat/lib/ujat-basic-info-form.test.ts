import { describe, expect, it } from 'vitest'
import {
  createUjatBasicInfoFormDefaults,
  stripUjatBasicInfoOverlay,
  ujatBasicInfoFormValuesFromLegacyOverlay,
} from './ujat-basic-info-form'

describe('UJAT basic-info RHF migration boundary', () => {
  it('removes only common-info keys from the legacy overlay snapshot', () => {
    expect(
      stripUjatBasicInfoOverlay({
        'ujat.basicInfo.repKo': 'UJAT',
        'ujat.basicInfo.surveyItems': { survey: true },
        'ujat.h1.event.name': '상반기 본교육',
        'ujat.recruit.institution.publicTitle': '기관 모집',
      })
    ).toEqual({
      'ujat.h1.event.name': '상반기 본교육',
      'ujat.recruit.institution.publicTitle': '기관 모집',
    })
  })

  it('hydrates an RHF snapshot once from legacy common-info keys', () => {
    const values = ujatBasicInfoFormValuesFromLegacyOverlay({
      'ujat.basicInfo.repKo': '대표 프로그램',
      'ujat.basicInfo.repEn': 'Representative',
      'ujat.basicInfo.programManagementName': '관리명',
      'ujat.basicInfo.operationRangeSeal': {
        start: '2027-04-01T00:00:00.000Z',
        end: '2027-04-30T00:00:00.000Z',
      },
      'ujat.basicInfo.surveyItems': {
        survey: false,
        volunteer_satisfaction: true,
        school_satisfaction: false,
        lecture_evaluation: true,
      },
      'ujat.basicInfo.participant.organization': true,
      'ujat.basicInfo.participant.volunteer': true,
      'ujat.basicInfo.businessField': 'digital_finance',
      'ujat.basicInfo.partnerInvolvement': 'yes',
    })

    expect(values).toMatchObject({
      mainTitle: '대표 프로그램',
      titleEn: 'Representative',
      title: '관리명',
      startDate: '2027-04-01T00:00:00.000Z',
      endDate: '2027-04-30T00:00:00.000Z',
      businessArea: 'digital_finance',
      partnerInvolvement: true,
      generalParticipantTypes: ['school_institution', 'volunteer'],
      surveySurvey: false,
      surveyVolunteerSatisfaction: true,
      surveySchoolSatisfaction: false,
      surveyLectureEvaluation: true,
    })
  })

  it('keeps explicit false values in the typed defaults contract', () => {
    const defaults = createUjatBasicInfoFormDefaults()
    expect(defaults.partnerInvolvement).toBe(false)
    expect(defaults.surveySurvey).toBe(true)
    expect(defaults.surveyVolunteerSatisfaction).toBe(true)
    expect(defaults.surveySchoolSatisfaction).toBe(true)
    expect(defaults.surveyLectureEvaluation).toBe(true)
    expect(defaults.venueKind).toBe('inside')
    expect(defaults.venueDetail).toBe('')
  })
})
