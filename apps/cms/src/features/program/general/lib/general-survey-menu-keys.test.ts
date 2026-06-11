import { describe, expect, it } from 'vitest'
import { normalizeGeneralSurveyMenuKeys } from './general-survey-menu-keys'

describe('normalizeGeneralSurveyMenuKeys', () => {
  it('레거시 satisfaction을 학생·교사 2항목으로 확장한다', () => {
    expect(normalizeGeneralSurveyMenuKeys(['survey', 'satisfaction', 'lecture_evaluation'])).toEqual([
      'survey',
      'student_satisfaction',
      'teacher_satisfaction',
      'lecture_evaluation',
    ])
  })

  it('4종 키를 그대로 유지한다', () => {
    expect(
      normalizeGeneralSurveyMenuKeys([
        'survey',
        'student_satisfaction',
        'teacher_satisfaction',
        'lecture_evaluation',
      ])
    ).toEqual(['survey', 'student_satisfaction', 'teacher_satisfaction', 'lecture_evaluation'])
  })
})
