import { describe, expect, it } from 'vitest'
import {
  classifyFormBindingByTemplateId,
  classifyProgramFormBindings,
  isDedicatedSurveyManagementTabTitle,
  isProgramSurveyManagementFormBinding,
  mapSurveyAnswersToRecord,
  mapSurveyResponseListItemToPollResponse,
  mapProgramSurveyToRegisteredSurvey,
  mergeSurveysWithBindings,
  readExpectedRespondentCount,
  resolveSurveyResultsParticipantTotal,
  isSurveyTemplateOptionForKind,
  parseAnswerPreviewJson,
  pickLectureEvalSurveyFromRemote,
  resolveLectureEvalSubmitContext,
  resolveSatisfactionAudienceFromBinding,
  resolveSurveyShareClipboardUrl,
  mapSurveySummaryToQuestionSummaries,
  surveyResponseNeedsDetail,
  surveySummaryHasPublicTextAnswers,
} from './program-survey-adapters'

describe('parseAnswerPreviewJson', () => {
  it('parses flat string map', () => {
    expect(parseAnswerPreviewJson('{"q1":"네","q2":3}')).toEqual({ q1: '네', q2: '3' })
  })

  it('returns empty on invalid json', () => {
    expect(parseAnswerPreviewJson('not-json')).toEqual({})
    expect(parseAnswerPreviewJson('')).toEqual({})
  })

  it('parses server preview array and skips masked answers', () => {
    expect(
      parseAnswerPreviewJson(
        JSON.stringify([
          { questionKey: 'q1', questionLabel: '만족도', answerDisplayText: 'scale-5' },
          { questionKey: 'q2', questionLabel: '이름', answerDisplayText: null },
        ])
      )
    ).toEqual({ q1: 'scale-5' })
  })
})

describe('isSurveyTemplateOptionForKind', () => {
  const rows = [
    { id: 'survey', templateName: '설문조사' },
    { id: 'survey-student', templateName: '만족도조사 (학생용)' },
    { id: 'survey-teacher', templateName: '만족도조사 (교사용)' },
    { id: 'survey-admin', templateName: '강의평가 (관리자용)' },
    { id: 'copy-1', templateName: '만족도조사 (학생용) 복사본' },
    { id: 'copy-2', templateName: '강의평가 (관리자용) 복사본' },
    { id: 'copy-3', templateName: '설문조사 복사본' },
  ]
  const idsFor = (kind: 'survey' | 'satisfaction' | 'lecture') =>
    rows.filter(row => isSurveyTemplateOptionForKind(row, kind)).map(row => row.id)

  it('설문조사 모달은 만족도·강의평가 템플릿을 제외한다', () => {
    expect(idsFor('survey')).toEqual(['survey', 'copy-3'])
  })

  it('만족도조사 모달은 만족도 템플릿과 복사본만 노출한다', () => {
    expect(idsFor('satisfaction')).toEqual(['survey-student', 'survey-teacher', 'copy-1'])
  })

  it('강의평가 모달은 강의평가 템플릿과 복사본만 노출한다', () => {
    expect(idsFor('lecture')).toEqual(['survey-admin', 'copy-2'])
  })

  it('이름이 바뀐 복제본도 baseTemplateCode로 원본 용도를 판별한다', () => {
    const renamed = {
      id: 'copy-9',
      templateName: '2026 하반기 학생 의견',
      baseTemplateCode: 'survey-student',
    }
    expect(isSurveyTemplateOptionForKind(renamed, 'satisfaction')).toBe(true)
    expect(isSurveyTemplateOptionForKind(renamed, 'survey')).toBe(false)
    const surveyCopy = {
      id: 'copy-10',
      templateName: '만족도 문항 포함 설문',
      baseTemplateCode: 'survey',
    }
    expect(isSurveyTemplateOptionForKind(surveyCopy, 'survey')).toBe(true)
  })
})

describe('surveyResponseNeedsDetail', () => {
  it('skips detail when preview covers every answer', () => {
    const preview = JSON.stringify([{ questionKey: 'q1', answerDisplayText: 'a' }])
    expect(
      surveyResponseNeedsDetail({ formResponseId: 1, answerCount: 1, answerPreviewJson: preview })
    ).toBe(false)
    expect(
      surveyResponseNeedsDetail({ formResponseId: 1, answerCount: 6, answerPreviewJson: preview })
    ).toBe(true)
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

describe('mapProgramSurveyToRegisteredSurvey', () => {
  it('uses surveys GET bindingId when merge binding is missing', () => {
    const row = mapProgramSurveyToRegisteredSurvey(
      {
        bindingId: 77,
        templateId: 200,
        templateVersionId: 2000,
        templateName: '설문',
        responseCount: 2,
      },
      0
    )
    expect(row.bindingId).toBe('77')
  })

  it('maps expectedRespondentCount and does not use submittedCount as the denominator', () => {
    const withExpected = mapProgramSurveyToRegisteredSurvey(
      {
        submittedCount: 4,
        expectedRespondentCount: 0,
      } as Parameters<typeof mapProgramSurveyToRegisteredSurvey>[0],
      0
    )
    expect(withExpected.expectedRespondentCount).toBe(0)
    expect(withExpected.participantTotal).toBe(0)
    expect(withExpected.responseCount).toBe(4)

    const withoutExpected = mapProgramSurveyToRegisteredSurvey(
      { submittedCount: 4, responseCount: 4 },
      0
    )
    expect(withoutExpected.expectedRespondentCount).toBeNull()
    expect(withoutExpected.participantTotal).toBe(0)
  })
})

describe('resolveSurveyResultsParticipantTotal', () => {
  it('prefers expected 0 over program total', () => {
    expect(
      resolveSurveyResultsParticipantTotal({ participantTotal: 0, expectedRespondentCount: 0 }, 216)
    ).toBe(0)
  })

  it('falls back to program total when expected is null', () => {
    expect(
      resolveSurveyResultsParticipantTotal(
        { participantTotal: 0, expectedRespondentCount: null },
        12
      )
    ).toBe(12)
  })
})

describe('readExpectedRespondentCount', () => {
  it('reads a non-negative integer and ignores missing values', () => {
    expect(readExpectedRespondentCount({ expectedRespondentCount: 8 })).toBe(8)
    expect(readExpectedRespondentCount({ expectedRespondentCount: null })).toBeNull()
    expect(readExpectedRespondentCount({})).toBeNull()
  })
})

describe('resolveLectureEvalSubmitContext', () => {
  it('prefers binding SCHEDULE over surveys GET', () => {
    expect(
      resolveLectureEvalSubmitContext({
        binding: { targetScope: 'SCHEDULE', targetScopeId: 11 },
        surveyDto: { targetScope: 'PROGRAM', targetScopeId: 99 },
      })
    ).toEqual({ contextType: 'SCHEDULE', contextId: 11 })
  })

  it('falls back to surveys GET targetScope when binding is empty', () => {
    expect(
      resolveLectureEvalSubmitContext({
        surveyDto: { targetScope: 'SCHEDULE', targetScopeId: 22 },
      })
    ).toEqual({ contextType: 'SCHEDULE', contextId: 22 })
  })
})

describe('pickLectureEvalSurveyFromRemote', () => {
  it('prefers PROGRAM scope lecture binding over SCHEDULE', () => {
    const row = pickLectureEvalSurveyFromRemote({
      classified: [
        {
          kind: 'lecture_evaluation',
          binding: { bindingId: 1, targetScope: 'SCHEDULE', targetScopeId: 99 },
          survey: {
            id: '1',
            title: '일정별',
            templateId: '9',
            status: 'in_progress',
            responseCount: 0,
            participantTotal: 1,
            bindingId: '1',
          },
        },
        {
          kind: 'lecture_evaluation',
          binding: { bindingId: 5, targetScope: 'PROGRAM' },
          survey: {
            id: '5',
            title: '프로그램 공통',
            templateId: '9',
            status: 'in_progress',
            responseCount: 0,
            participantTotal: 1,
            bindingId: '5',
          },
        },
      ],
      surveys: [],
    })
    expect(row?.title).toBe('프로그램 공통')
    expect(row?.bindingId).toBe('5')
  })

  it('uses classified lecture binding first', () => {
    const row = pickLectureEvalSurveyFromRemote({
      classified: [
        {
          kind: 'lecture_evaluation',
          binding: { bindingId: 5, templateName: '강의평가' },
          survey: {
            id: '5',
            title: '강의평가',
            templateId: '9',
            status: 'in_progress',
            responseCount: 0,
            participantTotal: 1,
            bindingId: '5',
          },
        },
      ],
      surveys: [{ templateName: '다른 강의평가', templateVersionId: 88 }],
    })
    expect(row?.bindingId).toBe('5')
  })

  it('falls back to surveys GET title when binding is missing', () => {
    const row = pickLectureEvalSurveyFromRemote({
      classified: [],
      surveys: [
        { bindingId: 77, templateName: '1회차 강의평가', templateVersionId: 300, templateId: 30 },
      ],
    })
    expect(row).toMatchObject({
      id: '300',
      title: '1회차 강의평가',
      bindingId: '77',
    })
  })
})

describe('isDedicatedSurveyManagementTabTitle', () => {
  it('keeps generic poll titles on the poll tab', () => {
    expect(isDedicatedSurveyManagementTabTitle('신규 설문조사 1')).toBe(false)
    expect(isDedicatedSurveyManagementTabTitle('강의평가')).toBe(true)
    expect(isDedicatedSurveyManagementTabTitle('만족도조사 (학생용)')).toBe(true)
  })
})

describe('classifyFormBindingByTemplateId', () => {
  it('classifies known satisfaction and lecture templates', () => {
    expect(
      classifyFormBindingByTemplateId({ templateId: 'survey-teacher' as unknown as number })
    ).toBe('satisfaction')
    expect(
      classifyFormBindingByTemplateId({ templateId: 'survey-admin' as unknown as number })
    ).toBe('lecture_evaluation')
    expect(classifyFormBindingByTemplateId({ templateId: 99, templateName: '일반 설문' })).toBe(
      'poll'
    )
  })

  it('keeps a SURVEY slot on the poll list even when the template name is satisfaction or lecture', () => {
    expect(
      classifyFormBindingByTemplateId({
        formType: 'SURVEY',
        templateName: '만족도조사 (학생용)',
        templateId: 42,
      })
    ).toBe('poll')
    expect(
      classifyFormBindingByTemplateId({
        formType: 'LECTURE_EVALUATION',
        templateName: '설문조사',
        templateId: 43,
      })
    ).toBe('lecture_evaluation')
  })

  it('resolves audience from targetRole', () => {
    expect(resolveSatisfactionAudienceFromBinding({ templateId: 1, targetRole: 'TEACHER' })).toBe(
      'teacher'
    )
  })

  it('resolves volunteer term from targetScopeId', () => {
    expect(
      resolveSatisfactionAudienceFromBinding({
        templateId: 1,
        targetRole: 'VOLUNTEER',
        targetScope: 'TERM',
        targetScopeId: 2,
      })
    ).toBe('volunteer_h2')
    expect(
      resolveSatisfactionAudienceFromBinding({
        templateId: 1,
        targetRole: 'VOLUNTEER',
        targetScope: 'TERM',
        targetScopeId: 1,
      })
    ).toBe('volunteer_h1')
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

  it('keeps multiple SURVEY poll bindings (same schedule, different template versions)', () => {
    const rows = mergeSurveysWithBindings(
      [],
      [
        {
          bindingId: 1,
          templateId: 10,
          templateVersionId: 100,
          formType: 'SURVEY',
          templateName: '설문 A',
          targetScope: 'SCHEDULE',
          targetScopeId: 186682,
          active: true,
        },
        {
          bindingId: 2,
          templateId: 11,
          templateVersionId: 101,
          formType: 'SURVEY',
          templateName: '설문 B',
          targetScope: 'SCHEDULE',
          targetScopeId: 186682,
          active: true,
        },
      ]
    )
    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.id).sort()).toEqual(['100', '101'])
  })

  it('lists a SURVEY binding on the poll tab when the template name looks like satisfaction', () => {
    const rows = mergeSurveysWithBindings(
      [],
      [
        {
          bindingId: 9,
          templateId: 42,
          templateVersionId: 420,
          formType: 'SURVEY',
          templateName: '만족도조사 (학생용)',
          active: true,
        },
      ]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.title).toBe('만족도조사 (학생용)')
  })
})

describe('resolveSurveyShareClipboardUrl', () => {
  it('builds the Platform UI URL from a PUBLIC_ANONYMOUS share token', () => {
    expect(
      resolveSurveyShareClipboardUrl(
        { accessMode: 'PUBLIC_ANONYMOUS', shareToken: 'abc' },
        'https://platform.example.com'
      )
    ).toBe('https://platform.example.com/surveys/share/abc')
  })

  it('does not expose backend formPath or submitPath as a shared UI URL', () => {
    const backendResponse = {
      accessMode: 'PUBLIC_ANONYMOUS',
      formPath: '/api/portal/public/surveys/abc',
      submitPath: '/api/portal/public/surveys/abc/responses',
    }
    expect(
      resolveSurveyShareClipboardUrl(backendResponse, 'https://platform.example.com')
    ).toBeNull()
  })

  it('rejects member-authenticated shares and invalid origin/token data', () => {
    expect(
      resolveSurveyShareClipboardUrl(
        { accessMode: 'MEMBER_AUTHENTICATED', shareToken: 'abc' },
        'https://platform.example.com'
      )
    ).toBeNull()
    expect(
      resolveSurveyShareClipboardUrl({ accessMode: 'PUBLIC_ANONYMOUS', shareToken: 'abc' }, null)
    ).toBeNull()
    expect(
      resolveSurveyShareClipboardUrl(
        { accessMode: 'PUBLIC_ANONYMOUS', shareToken: '' },
        'https://platform.example.com'
      )
    ).toBeNull()
  })
})

describe('mapSurveySummaryToQuestionSummaries', () => {
  it('keeps server order and maps options, order and required flags', () => {
    const rows = [
      {
        questionKey: 'survey-paragraph-title',
        questionLabel: '설문 제목',
        questionType: 'SURVEY_TITLE_WITH_PERIOD',
        summaryJson: '{"totalResponses":1,"topAnswers":[]}',
        questionDisplayOrder: 0,
        requiredYn: true,
      },
      {
        questionKey: 'survey-paragraph-star',
        questionLabel: '별점',
        questionType: 'STAR_RATE',
        summaryJson: JSON.stringify({
          totalResponses: 1,
          topAnswers: [{ answer: '1', count: 1 }],
          options: [{ value: '1', label: '1점', displayOrder: 0, count: 1 }],
          unmatchedCount: 0,
        }),
        questionDisplayOrder: 1,
        requiredYn: false,
      },
      { questionKey: 'orphan', questionType: 'SHORT_ESSAY', summaryJson: 'not-json' },
    ]
    expect(mapSurveySummaryToQuestionSummaries(rows)).toEqual([
      {
        questionKey: 'survey-paragraph-title',
        questionLabel: '설문 제목',
        questionType: 'SURVEY_TITLE_WITH_PERIOD',
        displayOrder: 0,
        required: true,
      },
      {
        questionKey: 'survey-paragraph-star',
        questionLabel: '별점',
        questionType: 'STAR_RATE',
        displayOrder: 1,
        required: false,
        options: [{ value: '1', label: '1점', displayOrder: 0, count: 1 }],
      },
      {
        questionKey: 'orphan',
        questionLabel: '',
        questionType: 'SHORT_ESSAY',
        displayOrder: null,
        required: false,
      },
    ])
  })
})

describe('surveySummaryHasPublicTextAnswers', () => {
  it('is false when short essay answers are masked', () => {
    expect(
      surveySummaryHasPublicTextAnswers([
        { questionType: 'SHORT_ESSAY', summaryJson: '{"topAnswers":[]}' },
      ])
    ).toBe(false)
  })

  it('is true when a short essay has public answers', () => {
    expect(
      surveySummaryHasPublicTextAnswers([
        {
          questionType: 'SHORT_ESSAY',
          summaryJson: '{"topAnswers":[{"answer":"좋아요","count":1}]}',
        },
      ])
    ).toBe(true)
  })
})

describe('mapSurveyResponseListItemToPollResponse — 주관식 공개 응답', () => {
  it('uses essay answerDisplayText and real respondent name from detail', () => {
    expect(
      mapSurveyResponseListItemToPollResponse(
        { formResponseId: 1851453, submittedByMemberName: '이건희일반', answerPreviewJson: '[]' },
        {
          formResponseId: 1851453,
          submittedByMemberName: '이건희일반',
          answers: [
            {
              questionKey: 'survey-paragraph-subjective',
              questionType: 'SHORT_ESSAY',
              answerValueJson:
                '{"bodyText":"123","items":[{"id":"survey-short-essay-item-1","bodyText":"123"}]}',
              answerDisplayText: '123',
            },
          ],
        }
      )
    ).toMatchObject({
      respondentName: '이건희일반',
      answers: { 'survey-paragraph-subjective': '123' },
    })
  })
})
