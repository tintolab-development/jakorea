import { describe, expect, it } from 'vitest'
import {
  applyLectureEvalAnswersToDraft,
  buildLectureEvalFormDraftSync,
  canDownloadLectureEvalResults,
  clearLectureEvalFormAnswers,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
  draftToLectureEvalSubmitAnswers,
  findOwnLectureEvalResponse,
  isLectureEvalFormPhase,
  isLectureEvalResultsTabAccessible,
  parseLectureEvalFormResponseId,
  parseOwnLectureEvalFormResponseId,
  LECTURE_EVAL_TEMPLATE_ID,
  validateLectureEvalFormDraft,
} from './lecture-eval-survey'
import type { SurveyPollRawResponse } from './survey-management-types'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

function scaleSelections(draft: WritingFormDraft): Array<string | null | undefined> {
  return draft.paragraphs
    .filter(
      (p): p is Extract<WritingFormParagraph, { variant: 'scale_type' }> =>
        p.kind === 'single_item' && p.variant === 'scale_type'
    )
    .map(p => p.selectedPreviewItemId)
}

describe('lecture eval write draft starts without answers', () => {
  it('seed draft carries a preview selection (「매우 그렇다」) that must not leak into the form', () => {
    expect(scaleSelections(createDefaultSurveyDraft())).toContain('scale-type-item-5')
  })

  it('clears scale preview selection on a version draft opened as-is', () => {
    const cleared = clearLectureEvalFormAnswers(createDefaultSurveyDraft())
    const selections = scaleSelections(cleared)
    expect(selections.length).toBeGreaterThan(0)
    expect(selections.every(id => id == null)).toBe(true)
  })

  it('clears multiple choice, star rate, short essay and respondent answers too', () => {
    const draft = {
      schemaVersion: 1,
      formSettings: { titleNumbering: 'q123' },
      paragraphs: [
        {
          id: 'q-mc',
          kind: 'single_item',
          variant: 'multiple_choice',
          allowMultiple: false,
          selectedPreviewSingleId: 'opt-1',
          selectedPreviewMultipleIds: ['opt-1'],
          paragraphTitle: '객관식',
          paragraphDescription: '',
          requiredMark: true,
          participatesInTitleNumbering: true,
          items: [{ id: 'opt-1', label: 'A' }],
        },
        {
          id: 'q-star',
          kind: 'single_item',
          variant: 'star_rate',
          selectedPreviewStars: 4,
          paragraphTitle: '별점',
          paragraphDescription: '',
          requiredMark: true,
          participatesInTitleNumbering: true,
        },
        {
          id: 'q-essay',
          kind: 'single_item',
          variant: 'short_essay',
          bodyText: '시드 답변',
          paragraphTitle: '주관식',
          paragraphDescription: '',
          requiredMark: true,
          participatesInTitleNumbering: true,
          items: [
            {
              id: 'e1',
              label: 'Title 01',
              placeholder: '답변을 입력해 주세요',
              bodyText: '시드 답변',
            },
          ],
        },
        {
          id: DEFAULT_SURVEY_PARAGRAPH_IDS.user,
          kind: 'single_item',
          variant: 'user_info',
          paragraphTitle: '설문자 정보',
          paragraphDescription: '',
          requiredMark: true,
          participatesInTitleNumbering: true,
          userFields: [{ key: 'name', label: '이름' }],
          selectedUserFieldKeys: ['name'],
          fieldAnswers: { name: '미리보기 이름' },
        },
      ],
    } as unknown as WritingFormDraft

    const cleared = clearLectureEvalFormAnswers(draft)
    const byId = new Map(
      cleared.paragraphs.map(p => [p.id, p as unknown as Record<string, unknown>])
    )
    expect(byId.get('q-mc')?.selectedPreviewSingleId).toBeNull()
    expect(byId.get('q-mc')?.selectedPreviewMultipleIds).toEqual([])
    expect(byId.get('q-star')?.selectedPreviewStars).toBeNull()
    expect(byId.get('q-essay')?.bodyText).toBe('')
    expect(byId.get(DEFAULT_SURVEY_PARAGRAPH_IDS.user)?.fieldAnswers).toEqual({})
  })

  it('keeps the survey title paragraph (title · period) as stored', () => {
    const seed = createDefaultSurveyDraft()
    const title = seed.paragraphs.find(p => p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title)
    const cleared = clearLectureEvalFormAnswers(seed)
    expect(cleared.paragraphs.find(p => p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title)).toEqual(title)
  })

  it('builds the seed form draft with nothing selected', () => {
    const draft = buildLectureEvalFormDraftSync(LECTURE_EVAL_TEMPLATE_ID)
    const selections = scaleSelections(draft)
    expect(selections.length).toBeGreaterThan(0)
    expect(selections.every(id => id == null)).toBe(true)
  })

  it('submit validation blocks an unanswered scale question', () => {
    const result = validateLectureEvalFormDraft(
      clearLectureEvalFormAnswers(createDefaultSurveyDraft())
    )
    expect(result.valid).toBe(false)
  })
})

describe('parseLectureEvalFormResponseId', () => {
  it('reads a numeric respondentId as formResponseId', () => {
    expect(
      parseLectureEvalFormResponseId([
        { respondentId: 'lecture-eval-admin', respondentName: 'x', addressRegion: '', answers: {} },
        { respondentId: '4412', respondentName: 'y', addressRegion: '', answers: {} },
      ])
    ).toBe(4412)
  })

  it('returns null when no numeric id exists', () => {
    expect(
      parseLectureEvalFormResponseId([
        { respondentId: 'lecture-eval-admin', respondentName: 'x', addressRegion: '', answers: {} },
      ])
    ).toBeNull()
  })
})

describe('applyLectureEvalAnswersToDraft', () => {
  it('hydrates scale and short essay from remote answers', () => {
    const draft = {
      paragraphs: [
        {
          id: 'q-scale',
          kind: 'single_item',
          variant: 'scale_type',
          paragraphTitle: '만족도',
          selectedPreviewItemId: '',
        },
        {
          id: 'q-essay',
          kind: 'single_item',
          variant: 'short_essay',
          paragraphTitle: '의견',
          bodyText: '',
          items: [{ bodyText: '' }],
        },
      ],
    } as unknown as WritingFormDraft

    const next = applyLectureEvalAnswersToDraft(draft, {
      'q-scale': 'item-3',
      'q-essay': '잘 들었습니다',
    })

    expect(next.paragraphs[0]).toMatchObject({
      id: 'q-scale',
      selectedPreviewItemId: 'item-3',
    })
    expect(next.paragraphs[1]).toMatchObject({
      id: 'q-essay',
      bodyText: '잘 들었습니다',
    })
  })
})

describe('draftToLectureEvalPollResponse', () => {
  it('sends gender as MALE/FEMALE (legacy typed 「여자」 → FEMALE)', () => {
    const draft = {
      paragraphs: [
        {
          id: 'user',
          kind: 'single_item',
          variant: 'user_info',
          userFields: [
            { key: 'name', label: '이름' },
            { key: 'gender', label: '성별' },
          ],
          selectedUserFieldKeys: ['name', 'gender'],
          fieldAnswers: { name: '테스트', gender: '여자' },
        },
      ],
    } as unknown as WritingFormDraft
    expect(draftToLectureEvalPollResponse(draft).answers).toMatchObject({ gender: 'FEMALE' })
  })

  it('includes user_info field keys in answers', () => {
    const draft = {
      paragraphs: [
        {
          id: 'user',
          kind: 'single_item',
          variant: 'user_info',
          userFields: [
            { key: 'name', label: '이름' },
            { key: 'addressRegion', label: '자택 주소지(지역)' },
          ],
          selectedUserFieldKeys: ['name', 'addressRegion'],
          fieldAnswers: {
            name: '테스트담당자',
            addressRegion: '서울특별시',
          },
        },
        {
          id: 'q-scale',
          kind: 'single_item',
          variant: 'scale_type',
          selectedPreviewItemId: 'item-3',
        },
      ],
    } as unknown as WritingFormDraft

    const response = draftToLectureEvalPollResponse(draft)
    expect(response.answers).toMatchObject({
      name: '테스트담당자',
      addressRegion: '서울특별시',
      'q-scale': 'item-3',
    })
    expect(response.respondentName).toBe('테스트담당자')
  })
})

function row(respondentId: string, submittedByAdminId?: number): SurveyPollRawResponse {
  return {
    respondentId,
    respondentName: '',
    addressRegion: '',
    answers: {},
    ...(submittedByAdminId != null ? { submittedByAdminId } : {}),
  }
}

describe('findOwnLectureEvalResponse', () => {
  it('picks the row submitted by the signed-in admin, not the first row', () => {
    const rows = [row('101', 7), row('102', 9)]
    expect(findOwnLectureEvalResponse(rows, 9)?.respondentId).toBe('102')
    expect(parseOwnLectureEvalFormResponseId(rows, 9)).toBe(102)
  })

  it('treats a missing own row as not submitted', () => {
    expect(findOwnLectureEvalResponse([row('101', 7)], 9)).toBeNull()
    expect(parseOwnLectureEvalFormResponseId([row('101', 7)], 9)).toBeNull()
  })

  it('does not claim another admin row when the admin id is unknown', () => {
    expect(findOwnLectureEvalResponse([row('101', 7)], null)).toBeNull()
    expect(findOwnLectureEvalResponse([row('local')], null)?.respondentId).toBe('local')
  })
})

describe('canEditLectureEvalResponse', () => {
  const now = new Date('2026-11-11T12:00:00+09:00')

  it('allows edits before the binding submissionEndAt', () => {
    expect(
      canEditLectureEvalResponse(
        { status: 'in_progress', submissionEndAt: '2026-11-12T00:00:00+09:00' },
        now
      )
    ).toBe(true)
  })

  it('blocks edits at or after submissionEndAt', () => {
    expect(
      canEditLectureEvalResponse(
        { status: 'in_progress', submissionEndAt: '2026-11-11T12:00:00+09:00' },
        now
      )
    ).toBe(false)
  })

  it('blocks edits before start and after finish', () => {
    expect(canEditLectureEvalResponse({ status: 'before_start' }, now)).toBe(false)
    expect(canEditLectureEvalResponse({ status: 'finished' }, now)).toBe(false)
  })

  it('defers to the server when the end date is unknown', () => {
    expect(canEditLectureEvalResponse({ status: 'in_progress' }, now)).toBe(true)
  })
})

describe('lecture eval phase gates', () => {
  it('opens results only after FINISHED', () => {
    const base = { id: '1', title: '', templateId: '', responseCount: 1, participantTotal: 1 }
    expect(isLectureEvalResultsTabAccessible({ ...base, status: 'in_progress' })).toBe(false)
    expect(isLectureEvalResultsTabAccessible({ ...base, status: 'finished' })).toBe(true)

  })

  it('keeps results open while in progress when the survey has no deadline', () => {
    expect(isLectureEvalResultsTabAccessible({ status: 'in_progress', submissionOpenEnded: true })).toBe(true)
    expect(isLectureEvalResultsTabAccessible({ status: 'before_start', submissionOpenEnded: true })).toBe(false)
    expect(isLectureEvalResultsTabAccessible({ status: 'in_progress' })).toBe(false)
  })

  it('shows the submit form only while in progress without an own response', () => {
    expect(isLectureEvalFormPhase({ status: 'in_progress' }, false)).toBe(true)
    expect(isLectureEvalFormPhase({ status: 'in_progress' }, true)).toBe(false)
    expect(isLectureEvalFormPhase({ status: 'before_start' }, false)).toBe(false)
    expect(isLectureEvalFormPhase({ status: 'finished' }, false)).toBe(false)
  })

  it('enables download only when the binding says resultDownloadable', () => {
    expect(canDownloadLectureEvalResults({ resultDownloadable: true })).toBe(true)
    expect(canDownloadLectureEvalResults({ resultDownloadable: false })).toBe(false)
    expect(canDownloadLectureEvalResults({ resultDownloadable: null })).toBe(false)
    expect(canDownloadLectureEvalResults(null)).toBe(false)
  })
})

describe('draftToLectureEvalSubmitAnswers', () => {
  it('nests user_info answers under the paragraph id and drops flat keys', () => {
    const draft = {
      paragraphs: [
        {
          id: 'survey-paragraph-user',
          kind: 'single_item',
          variant: 'user_info',
          userFields: [
            { key: 'name', label: '이름' },
            { key: 'gender', label: '성별' },
            { key: 'phone', label: '연락처' },
          ],
          selectedUserFieldKeys: ['name', 'gender', 'phone'],
          fieldAnswers: { name: '최지원', gender: 'FEMALE', phone: '' },
        },
        {
          id: 'survey-paragraph-score-2',
          kind: 'single_item',
          variant: 'scale_type',
          selectedPreviewItemId: 'scale-type-item-4',
        },
      ],
    } as unknown as WritingFormDraft
    const answers = draftToLectureEvalSubmitAnswers(draft)
    expect(answers).toEqual({
      'survey-paragraph-user': { name: '최지원', gender: 'FEMALE' },
      'survey-paragraph-score-2': 'scale-type-item-4',
    })
    expect(answers).not.toHaveProperty('name')
    expect(answers).not.toHaveProperty('gender')
  })
  const multipleChoice = (selected: string[], allowMultiple = true) =>
    ({
      paragraphs: [
        {
          id: 'survey-paragraph-score',
          kind: 'single_item',
          variant: 'multiple_choice',
          allowMultiple,
          selectedPreviewSingleId: allowMultiple ? null : (selected[0] ?? null),
          selectedPreviewMultipleIds: allowMultiple ? selected : [],
        },
      ],
    }) as unknown as WritingFormDraft

  it('sends MULTIPLE_CHOICE as an array of option values, not a comma string', () => {
    const answers = draftToLectureEvalSubmitAnswers(
      multipleChoice(['multiple-choice-item-1', 'multiple-choice-item-2'])
    )
    expect(answers['survey-paragraph-score']).toEqual([
      'multiple-choice-item-1',
      'multiple-choice-item-2',
    ])
  })

  it('sends a single selection as a one-element array', () => {
    expect(
      draftToLectureEvalSubmitAnswers(multipleChoice(['multiple-choice-item-1']))[
        'survey-paragraph-score'
      ]
    ).toEqual(['multiple-choice-item-1'])
    expect(
      draftToLectureEvalSubmitAnswers(multipleChoice(['multiple-choice-item-3'], false))[
        'survey-paragraph-score'
      ]
    ).toEqual(['multiple-choice-item-3'])
  })

  it('omits the key when nothing is selected', () => {
    expect(draftToLectureEvalSubmitAnswers(multipleChoice([]))).not.toHaveProperty(
      'survey-paragraph-score'
    )
  })

  it('restores checked options from the server JSON array value', () => {
    const restored = applyLectureEvalAnswersToDraft(multipleChoice([]), {
      'survey-paragraph-score': '["multiple-choice-item-1","multiple-choice-item-2"]',
    })
    expect(restored.paragraphs[0]).toMatchObject({
      selectedPreviewMultipleIds: ['multiple-choice-item-1', 'multiple-choice-item-2'],
    })
    const single = applyLectureEvalAnswersToDraft(multipleChoice([], false), {
      'survey-paragraph-score': '["multiple-choice-item-2"]',
    })
    expect(single.paragraphs[0]).toMatchObject({ selectedPreviewSingleId: 'multiple-choice-item-2' })
  })
})

