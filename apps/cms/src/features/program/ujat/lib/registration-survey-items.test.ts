import { describe, expect, it } from 'vitest'
import {
  createUjatSurveyItemsDefault,
  readUjatSurveyItems,
  resolveUjatSurveyItemsText,
  ujatGeneralSurveyMenuKeysFromOverlay,
  resolveUjatPersistedSurveyMenuKeysForSave,
  ujatSurveyItemsFromProgramKeys,
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

  it('satisfaction 한 키만으로는 봉사단·학교 만족도를 켜지 않는다', () => {
    expect(
      readUjatSurveyItems(
        {
          survey: true,
          satisfaction: true,
          lecture_evaluation: true,
        },
        createUjatSurveyItemsDefault(false)
      )
    ).toEqual({
      survey: true,
      volunteer_satisfaction: false,
      school_satisfaction: false,
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

describe('ujatSurveyItemsFromProgramKeys / ujatGeneralSurveyMenuKeysFromOverlay', () => {
  it('satisfaction 한 키는 봉사단·학교 메뉴를 만들지 않는다', () => {
    const items = ujatSurveyItemsFromProgramKeys(['survey', 'satisfaction', 'lecture_evaluation'])
    expect(items).toEqual({
      survey: true,
      volunteer_satisfaction: false,
      school_satisfaction: false,
      lecture_evaluation: true,
    })
    expect(
      ujatGeneralSurveyMenuKeysFromOverlay({ 'ujat.basicInfo.surveyItems': items })
    ).toEqual(['survey', 'lecture_evaluation'])
  })

  it('봉사단만 켠 키는 학교 만족도를 켜지 않는다', () => {
    expect(ujatSurveyItemsFromProgramKeys(['volunteer_satisfaction'])).toEqual({
      survey: false,
      volunteer_satisfaction: true,
      school_satisfaction: false,
      lecture_evaluation: false,
    })
  })

  it('LNB id도 4종으로 나눈다', () => {
    expect(
      ujatSurveyItemsFromProgramKeys([
        'survey-volunteer-satisfaction',
        'survey-school-satisfaction',
      ])
    ).toMatchObject({
      volunteer_satisfaction: true,
      school_satisfaction: true,
      survey: false,
      lecture_evaluation: false,
    })
  })

  it('학교만 체크한 overlay는 school_satisfaction 키만 남긴다', () => {
    expect(
      ujatGeneralSurveyMenuKeysFromOverlay({
        'ujat.basicInfo.surveyItems': {
          survey: true,
          volunteer_satisfaction: false,
          school_satisfaction: true,
          lecture_evaluation: true,
        },
      })
    ).toEqual(['survey', 'school_satisfaction', 'lecture_evaluation'])
  })

  it('overlay에 surveyItems 키가 없으면 envelope 변환을 하지 않는다', () => {
    expect(ujatGeneralSurveyMenuKeysFromOverlay({})).toBeUndefined()
  })

  it('저장 키는 overlay 4종을 쓰고 satisfaction으로 접지 않는다', () => {
    expect(
      resolveUjatPersistedSurveyMenuKeysForSave(
        {
          'ujat.basicInfo.surveyItems': {
            survey: false,
            volunteer_satisfaction: true,
            school_satisfaction: true,
            lecture_evaluation: false,
          },
        },
        ['survey', 'satisfaction', 'lecture_evaluation']
      )
    ).toEqual(['volunteer_satisfaction', 'school_satisfaction'])
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
