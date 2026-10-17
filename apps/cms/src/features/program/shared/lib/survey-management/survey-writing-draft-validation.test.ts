import { describe, expect, it } from 'vitest'
import {
  createDefaultSurveyDraft,
  createNewSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  listIncompleteSurveyWritingDraftKeys,
  SURVEY_WRITING_INCOMPLETE_KEYS,
} from './survey-writing-draft-validation'

describe('survey-writing-draft-validation', () => {
  it('제목·문항 단락이 비어 있으면 진단 키를 반환한다', () => {
    const draft = normalizeWritingFormDraft(createNewSurveyDraft())
    expect(listIncompleteSurveyWritingDraftKeys(draft)).toEqual([
      SURVEY_WRITING_INCOMPLETE_KEYS.title,
    ])
  })

  it('제목을 채우면 제목 키는 사라진다', () => {
    const draft = normalizeWritingFormDraft(createNewSurveyDraft())
    const withTitle = normalizeWritingFormDraft({
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title &&
        p.kind === 'description' &&
        p.variant === 'survey_title_with_period'
          ? { ...p, surveyTitle: '만족도 조사' }
          : p
      ),
    })
    expect(listIncompleteSurveyWritingDraftKeys(withTitle)).toEqual([])
  })

  it('문항 단락만 없으면 middle 키를 반환한다', () => {
    const draft = normalizeWritingFormDraft(createDefaultSurveyDraft())
    const titleOnly = normalizeWritingFormDraft({
      ...draft,
      paragraphs: draft.paragraphs
        .map(p =>
          p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title &&
          p.kind === 'description' &&
          p.variant === 'survey_title_with_period'
            ? { ...p, surveyTitle: '만족도 조사' }
            : p
        )
        .filter(
          p =>
            p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title ||
            p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.user ||
            p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.closing
        ),
    })
    const middleKeys = listIncompleteSurveyWritingDraftKeys(titleOnly)
    expect(middleKeys).toHaveLength(1)
    expect(middleKeys[0]).toMatch(
      new RegExp(`^${SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs}:`)
    )
  })
})
