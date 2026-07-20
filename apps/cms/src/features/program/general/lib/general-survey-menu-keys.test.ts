import { describe, expect, it } from 'vitest'
import { normalizeGeneralSurveyMenuKeys } from './general-survey-menu-keys'

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
