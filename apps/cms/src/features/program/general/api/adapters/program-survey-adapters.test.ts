import { describe, expect, it } from 'vitest'
import {
  classifyFormBindingByTemplateId,
  classifyProgramFormBindings,
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
})
