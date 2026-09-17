import { describe, expect, it } from 'vitest'
import {
  classifyFormBindingByTemplateId,
  classifyProgramFormBindings,
  isProgramSurveyManagementFormBinding,
  mapSurveyAnswersToRecord,
  mapSurveyResponseListItemToPollResponse,
  mergeSurveysWithBindings,
  parseAnswerPreviewJson,
  resolveSatisfactionAudienceFromBinding,
  surveyResponseNeedsDetail,
} from './program-survey-adapters'

describe('parseAnswerPreviewJson', () => {
  it('parses flat string map', () => {
    expect(parseAnswerPreviewJson('{"q1":"네","q2":3}')).toEqual({ q1: '네', q2: '3' })
  })

  it('returns empty on invalid json', () => {
    expect(parseAnswerPreviewJson('not-json')).toEqual({})
    expect(parseAnswerPreviewJson('')).toEqual({})
  })
})

describe('mapSurveyAnswersToRecord', () => {
  it('maps questionKey to display text', () => {
    expect(
      mapSurveyAnswersToRecord([
        { questionKey: 'q1', answerDisplayText: '만족' },
        { questionId: 2, answerValueJson: '"보통"' },
      ])
    ).toEqual({ q1: '만족', '2': '보통' })
  })
})

describe('mapSurveyResponseListItemToPollResponse', () => {
  it('prefers detail answers over preview', () => {
    const row = mapSurveyResponseListItemToPollResponse(
      {
        formResponseId: 10,
        submittedByMemberName: '김응답',
        answerPreviewJson: '{"q1":"preview"}',
      },
      {
        formResponseId: 10,
        answers: [{ questionKey: 'q1', answerDisplayText: 'detail' }],
      }
    )
    expect(row).toMatchObject({
      respondentId: '10',
      respondentName: '김응답',
      answers: { q1: 'detail' },
    })
  })

  it('falls back to preview when detail missing', () => {
    const row = mapSurveyResponseListItemToPollResponse({
      formResponseId: 11,
      answerPreviewJson: '{"a":"1"}',
    })
    expect(row.answers).toEqual({ a: '1' })
    expect(surveyResponseNeedsDetail({ formResponseId: 11 })).toBe(true)
    expect(surveyResponseNeedsDetail({ formResponseId: 11, answerPreviewJson: '{"a":"1"}' })).toBe(
      false
    )
  })
})

describe('classifyFormBindingByTemplateId', () => {
  it('classifies known satisfaction and lecture templates', () => {
    expect(classifyFormBindingByTemplateId({ templateId: 'survey-teacher' as unknown as number })).toBe(
      'satisfaction'
    )
    expect(classifyFormBindingByTemplateId({ templateId: 'survey-admin' as unknown as number })).toBe(
      'lecture_evaluation'
    )
    expect(classifyFormBindingByTemplateId({ templateId: 99, templateName: '일반 설문' })).toBe('poll')
  })

  it('resolves audience from targetRole', () => {
    expect(
      resolveSatisfactionAudienceFromBinding({ templateId: 1, targetRole: 'TEACHER' })
    ).toBe('teacher')
  })
})

describe('isProgramSurveyManagementFormBinding', () => {
  it('excludes registration, recruitment, and application bindings', () => {
    expect(
      isProgramSurveyManagementFormBinding({
        formType: 'REGISTRATION',
        templateName: '일반 프로그램 등록 폼',
      })
    ).toBe(false)
    expect(
      isProgramSurveyManagementFormBinding({
        formType: 'RECRUITMENT',
        templateName: '프로그램 참여자 모집 폼 (학교)',
      })
    ).toBe(false)
    expect(
      isProgramSurveyManagementFormBinding({
        formType: 'APPLICATION',
        templateName: '프로그램 참여자 신청 폼 (학교)',
      })
    ).toBe(false)
  })

  it('includes survey management bindings', () => {
    expect(
      isProgramSurveyManagementFormBinding({
        formType: 'SURVEY',
        templateName: '설문조사 1',
      })
    ).toBe(true)
    expect(
      isProgramSurveyManagementFormBinding({
        formType: 'SATISFACTION',
        templateName: '교사 만족도조사',
      })
    ).toBe(true)
    expect(
      isProgramSurveyManagementFormBinding({
        formType: 'LECTURE_EVALUATION',
        templateName: '강의 평가 (관리자용)',
      })
    ).toBe(true)
  })

  it('falls back to templateName when formType is missing', () => {
    expect(
      isProgramSurveyManagementFormBinding({
        templateName: '일반 프로그램 등록 폼',
      })
    ).toBe(false)
    expect(
      isProgramSurveyManagementFormBinding({
        templateName: '일반 설문',
      })
    ).toBe(true)
  })
})

describe('classifyProgramFormBindings / mergeSurveysWithBindings', () => {
  it('filters inactive and classifies', () => {
    const classified = classifyProgramFormBindings([
      { bindingId: 1, templateId: 'survey-admin' as unknown as number, active: true },
      { bindingId: 2, templateId: 99, active: false },
    ])
    expect(classified).toHaveLength(1)
    expect(classified[0]?.kind).toBe('lecture_evaluation')
  })

  it('merges survey list with binding metadata', () => {
    const rows = mergeSurveysWithBindings(
      [{ templateId: 1, templateVersionId: 10, templateName: '설문A', responseCount: 3 }],
      [
        {
          bindingId: 1,
          templateId: 1,
          templateVersionId: 10,
          formType: 'SURVEY',
          submissionStartAt: '2020-01-01T00:00:00Z',
          submissionEndAt: '2099-01-01T00:00:00Z',
          submittedCount: 3,
          active: true,
        },
      ]
    )
    expect(rows[0]).toMatchObject({
      id: '10',
      title: '설문A',
      templateId: '1',
      status: 'in_progress',
      responseCount: 3,
    })
  })

  it('does not merge operational form bindings into survey poll list', () => {
    const rows = mergeSurveysWithBindings(
      [],
      [
        {
          bindingId: 1,
          templateId: 100,
          templateVersionId: 1000,
          formType: 'REGISTRATION',
          templateName: '일반 프로그램 등록 폼',
          active: true,
        },
        {
          bindingId: 2,
          templateId: 101,
          templateVersionId: 1001,
          formType: 'RECRUITMENT',
          templateName: '프로그램 참여자 모집 폼 (학교)',
          active: true,
        },
        {
          bindingId: 3,
          templateId: 102,
          templateVersionId: 1002,
          formType: 'APPLICATION',
          templateName: '프로그램 참여자 신청 폼 (학교)',
          active: true,
        },
        {
          bindingId: 4,
          templateId: 200,
          templateVersionId: 2000,
          formType: 'SURVEY',
          templateName: '신규 설문조사 1',
          active: true,
        },
      ]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: '2000',
      title: '신규 설문조사 1',
      templateId: '200',
    })
  })
})
