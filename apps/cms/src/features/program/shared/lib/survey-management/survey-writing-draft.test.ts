/**
 * 프로그램 설문 관리 draft — form-template remote SSOT
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  loadWritingFormTemplateDraftMock,
  persistWritingFormTemplateDraftMock,
  localStorageStore,
} = vi.hoisted(() => {
  const store = new Map<string, string>()
  return {
    loadWritingFormTemplateDraftMock: vi.fn(),
    persistWritingFormTemplateDraftMock: vi.fn(),
    localStorageStore: store,
  }
})

vi.mock('@/features/template/lib/writing-form-template-local-save', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/template/lib/writing-form-template-local-save')>()
  return {
    ...actual,
    loadWritingFormTemplateDraft: loadWritingFormTemplateDraftMock,
    persistWritingFormTemplateDraft: persistWritingFormTemplateDraftMock,
  }
})

vi.stubGlobal('localStorage', {
  getItem: (key: string) => localStorageStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    localStorageStore.set(key, value)
  },
  removeItem: (key: string) => {
    localStorageStore.delete(key)
  },
  clear: () => localStorageStore.clear(),
  key: () => null,
  get length() {
    return localStorageStore.size
  },
})

import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  loadWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  applySurveyDisplayTitleToDraft,
  resolveSurveyWritingDraft,
  saveSurveyWritingTemplate,
} from './survey-writing-draft'

const TEMPLATE_ID = 'survey-admin'

describe('survey-writing-draft remote SSOT', () => {
  beforeEach(() => {
    localStorageStore.clear()
    loadWritingFormTemplateDraftMock.mockReset()
    persistWritingFormTemplateDraftMock.mockReset()
  })

  it('resolves remote draft without reading localStorage', async () => {
    const remoteDraft = normalizeWritingFormDraft(createDefaultSurveyDraft())
    loadWritingFormTemplateDraftMock.mockResolvedValue({
      version: 1,
      templateId: TEMPLATE_ID,
      savedAt: new Date().toISOString(),
      draft: remoteDraft,
    })

    const draft = await resolveSurveyWritingDraft(TEMPLATE_ID)
    expect(draft).toEqual(remoteDraft)
    expect(loadWritingFormTemplateSave(TEMPLATE_ID)).toBeNull()
  })

  it('fills empty surveyTitle on remote draft with the registered display name', async () => {
    const remoteDraft = normalizeWritingFormDraft(createDefaultSurveyDraft())
    loadWritingFormTemplateDraftMock.mockResolvedValue({
      version: 1,
      templateId: TEMPLATE_ID,
      savedAt: new Date().toISOString(),
      draft: remoteDraft,
    })

    const draft = await resolveSurveyWritingDraft(TEMPLATE_ID, {
      templateName: '학생용 만족도조사',
    })
    const titleParagraph = draft.paragraphs.find(
      (
        p
      ): p is Extract<
        (typeof draft.paragraphs)[number],
        { kind: 'description'; variant: 'survey_title_with_period' }
      > => p.kind === 'description' && p.variant === 'survey_title_with_period'
    )
    expect(titleParagraph?.surveyTitle).toBe('학생용 만족도조사')
  })

  it('overwrites an existing surveyTitle when asked', () => {
    const draft = applySurveyDisplayTitleToDraft(
      normalizeWritingFormDraft({
        ...createDefaultSurveyDraft(),
        paragraphs: createDefaultSurveyDraft().paragraphs.map(p =>
          p.kind === 'description' && p.variant === 'survey_title_with_period'
            ? { ...p, surveyTitle: '양식에 적힌 제목' }
            : p
        ),
      }),
      '1회차 · 2026.11.12(목) 만족도조사 (학생용)',
      { overwrite: true }
    )
    const titleParagraph = draft.paragraphs.find(
      (
        p
      ): p is Extract<
        (typeof draft.paragraphs)[number],
        { kind: 'description'; variant: 'survey_title_with_period' }
      > => p.kind === 'description' && p.variant === 'survey_title_with_period'
    )
    expect(titleParagraph?.surveyTitle).toBe('1회차 · 2026.11.12(목) 만족도조사 (학생용)')
  })

  it('does not overwrite an existing surveyTitle', () => {
    const draft = applySurveyDisplayTitleToDraft(
      normalizeWritingFormDraft({
        ...createDefaultSurveyDraft(),
        paragraphs: createDefaultSurveyDraft().paragraphs.map(p =>
          p.kind === 'description' && p.variant === 'survey_title_with_period'
            ? { ...p, surveyTitle: '양식에 적힌 제목' }
            : p
        ),
      }),
      '등록명'
    )
    const titleParagraph = draft.paragraphs.find(
      (
        p
      ): p is Extract<
        (typeof draft.paragraphs)[number],
        { kind: 'description'; variant: 'survey_title_with_period' }
      > => p.kind === 'description' && p.variant === 'survey_title_with_period'
    )
    expect(titleParagraph?.surveyTitle).toBe('양식에 적힌 제목')
  })

  it('saves via remote and does not write localStorage', async () => {
    persistWritingFormTemplateDraftMock.mockResolvedValue(undefined)
    const draft = normalizeWritingFormDraft({
      ...createDefaultSurveyDraft(),
      paragraphs: createDefaultSurveyDraft().paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title &&
        p.kind === 'description' &&
        p.variant === 'survey_title_with_period'
          ? { ...p, surveyTitle: '만족도 조사' }
          : p
      ),
    })

    const result = await saveSurveyWritingTemplate(TEMPLATE_ID, draft)
    expect(result).toEqual({ ok: true })
    expect(persistWritingFormTemplateDraftMock).toHaveBeenCalledWith({
      templateId: TEMPLATE_ID,
      draft,
    })
    expect(loadWritingFormTemplateSave(TEMPLATE_ID)).toBeNull()
  })
})
