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
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  loadWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import {
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

  it('saves via remote and does not write localStorage', async () => {
    persistWritingFormTemplateDraftMock.mockResolvedValue(undefined)
    const draft = normalizeWritingFormDraft(createDefaultSurveyDraft())

    const result = await saveSurveyWritingTemplate(TEMPLATE_ID, draft)
    expect(result).toEqual({ ok: true })
    expect(persistWritingFormTemplateDraftMock).toHaveBeenCalledWith({
      templateId: TEMPLATE_ID,
      draft,
    })
    expect(loadWritingFormTemplateSave(TEMPLATE_ID)).toBeNull()
  })
})
