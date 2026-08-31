import { describe, expect, it } from 'vitest'
import {
  createUjatSurveyItemsDefault,
  readUjatSurveyItems,
  resolveUjatSurveyItemsText,
  UJAT_REGISTRATION_SURVEY_ITEM_IDS,
  UJAT_SURVEY_MENU_KEY_BY_ITEM,
} from './registration-survey-items'

describe('readUjatSurveyItems', () => {
  it('4종 키를 그대로 읽는다', () => {
    expect(
      readUjatSurveyItems({
        survey: true,
        volunteer_satisfaction: false,
        school_satisfaction: true,
        lecture_evaluation: false,
      })
    ).toEqual({
      survey: true,
      volunteer_satisfaction: false,
      school_satisfaction: true,
      lecture_evaluation: false,
    })
  })

  it('레거시 satisfaction 단일 키를 봉사단·학교 만족도로 펼친다', () => {
    expect(
      readUjatSurveyItems({
        survey: true,
        satisfaction: true,
        lecture_evaluation: true,
      })
    ).toEqual({
      survey: true,
      volunteer_satisfaction: true,
      school_satisfaction: true,
      lecture_evaluation: true,
    })
  })

  it('명시된 봉사단/학교 키가 레거시 합치기보다 우선한다', () => {
    expect(
      readUjatSurveyItems({
        satisfaction: true,
        volunteer_satisfaction: false,
        school_satisfaction: true,
      })
    ).toEqual({
      survey: true,
      volunteer_satisfaction: false,
      school_satisfaction: true,
      lecture_evaluation: true,
    })
  })
})

describe('UJAT 설문 4종 상수', () => {
  it('등록 체크박스 순서와 LNB 키가 기획 4종과 같다', () => {
    expect([...UJAT_REGISTRATION_SURVEY_ITEM_IDS]).toEqual([
      'survey',
      'volunteer_satisfaction',
      'school_satisfaction',
      'lecture_evaluation',
    ])
    expect(UJAT_SURVEY_MENU_KEY_BY_ITEM).toEqual({
      survey: 'survey-poll',
      volunteer_satisfaction: 'survey-volunteer-satisfaction',
      school_satisfaction: 'survey-school-satisfaction',
      lecture_evaluation: 'survey-lecture-eval',
    })
  })

  it('표시 문구는 체크된 항목만 쉼표로 잇는다', () => {
    expect(
      resolveUjatSurveyItemsText({
        ...createUjatSurveyItemsDefault(false),
        survey: true,
        school_satisfaction: true,
      })
    ).toBe('설문조사, 학교 만족도조사')
  })
})
