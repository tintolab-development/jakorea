import { describe, expect, it } from 'vitest'
import {
  normalizeGeneralSurveyMenuKeys,
  resolveGeneralSurveyMenuKeys,
  surveyMenuKeysFromRegistrationOverlay,
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
  it('등록 overlay 체크가 컬럼 키보다 우선한다', () => {
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
    ).toEqual(['survey'])
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

  it('overlay에서 0개 선택이면 빈 배열이다', () => {
    expect(
      resolveGeneralSurveyMenuKeys({
        keys: ['survey'],
        overlay: {
          'generalRegistration.basicInfo.surveyItems': {
            survey: false,
            satisfaction: false,
            lecture_evaluation: false,
          },
        },
      })
    ).toEqual([])
  })

  it('overlay가 없으면 컬럼 키를 정규화한다', () => {
    expect(
      resolveGeneralSurveyMenuKeys({
        keys: ['student_satisfaction', 'lecture_evaluation'],
      })
    ).toEqual(['satisfaction', 'lecture_evaluation'])
  })
})
