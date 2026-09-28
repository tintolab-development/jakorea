import { describe, expect, it } from 'vitest'
import {
  normalizeGeneralSurveyMenuKeys,
  resolveGeneralSurveyMenuKeys,
  surveyMenuKeysFromRegistrationOverlay,
  syncSurveyItemsIntoRegistrationOverlay,
} from './general-survey-menu-keys'

describe('normalizeGeneralSurveyMenuKeys', () => {
  it('공통 3종 키를 그대로 유지한다', () => {
    expect(normalizeGeneralSurveyMenuKeys(['survey', 'satisfaction', 'lecture_evaluation'])).toEqual([
      'survey',
      'satisfaction',
      'lecture_evaluation',
    ])
  })

  it('레거시 학생·교사 만족도 키를 satisfaction 하나로 합친다', () => {
    expect(
      normalizeGeneralSurveyMenuKeys([
        'survey',
        'student_satisfaction',
        'teacher_satisfaction',
        'lecture_evaluation',
      ])
    ).toEqual(['survey', 'satisfaction', 'lecture_evaluation'])
  })

  it('UJAT 레거시 봉사단·학교 만족도 키를 satisfaction 하나로 합친다', () => {
    expect(
      normalizeGeneralSurveyMenuKeys(['survey', 'volunteer_satisfaction', 'school_satisfaction'])
    ).toEqual(['survey', 'satisfaction'])
  })
})

describe('resolveGeneralSurveyMenuKeys', () => {
  it('컬럼 키가 있으면 overlay보다 우선한다 (LNB SSOT)', () => {
    expect(
      resolveGeneralSurveyMenuKeys({
        keys: ['survey', 'satisfaction', 'lecture_evaluation'],
        overlay: {
          'generalRegistration.basicInfo.surveyItems': {
            survey: true,
            satisfaction: false,
            lecture_evaluation: false,
          },
        },
      })
    ).toEqual(['survey', 'satisfaction', 'lecture_evaluation'])
  })

  it('1사1교 overlay 키도 읽는다', () => {
    expect(
      surveyMenuKeysFromRegistrationOverlay({
        'economyRegistration.basicInfo.surveyItems': {
          survey: true,
          satisfaction: true,
          lecture_evaluation: false,
        },
      })
    ).toEqual(['survey', 'satisfaction'])
  })

  it('교육받은 교사 overlay 키도 읽는다', () => {
    expect(
      surveyMenuKeysFromRegistrationOverlay({
        'trainedTeachersRegistration.basicInfo.surveyItems': {
          survey: true,
          satisfaction: false,
          lecture_evaluation: true,
        },
      })
    ).toEqual(['survey', 'lecture_evaluation'])
  })

  it('키가 빈 배열이면 0개 선택이다', () => {
    expect(
      resolveGeneralSurveyMenuKeys({
        keys: [],
        overlay: {
          'generalRegistration.basicInfo.surveyItems': {
            survey: true,
            satisfaction: false,
            lecture_evaluation: false,
          },
        },
      })
    ).toEqual([])
  })

  it('키가 없으면 overlay 체크를 쓴다', () => {
    expect(
      resolveGeneralSurveyMenuKeys({
        overlay: {
          'generalRegistration.basicInfo.surveyItems': {
            survey: true,
            satisfaction: false,
            lecture_evaluation: true,
          },
        },
      })
    ).toEqual(['survey', 'lecture_evaluation'])
  })

  it('overlay가 없으면 컬럼 키를 정규화한다', () => {
    expect(
      resolveGeneralSurveyMenuKeys({
        keys: ['student_satisfaction', 'lecture_evaluation'],
      })
    ).toEqual(['satisfaction', 'lecture_evaluation'])
  })
})
describe('syncSurveyItemsIntoRegistrationOverlay', () => {
  it('keys에 맞춰 general·TT surveyItems를 덮어쓴다', () => {
    expect(
      syncSurveyItemsIntoRegistrationOverlay(
        {
          'generalRegistration.basicInfo.surveyItems': {
            survey: false,
            satisfaction: false,
            lecture_evaluation: false,
          },
        },
        ['survey', 'lecture_evaluation']
      )
    ).toMatchObject({
      'generalRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: false,
        lecture_evaluation: true,
      },
      'trainedTeachersRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: false,
        lecture_evaluation: true,
      },
    })
  })
})
