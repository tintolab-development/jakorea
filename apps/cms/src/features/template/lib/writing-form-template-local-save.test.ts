/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  loadFormTemplateVersionDraft: vi.fn(),
  saveFormTemplateVersionDraft: vi.fn(),
  loadFormTemplateVersionDraftByVersionId: vi.fn(),
  saveFormTemplateVersionDraftByVersionId: vi.fn(),
}))

import {
  loadFormTemplateVersionDraft,
  saveFormTemplateVersionDraft,
} from '@/features/template/api/admin-form-templates-service'
import {
  loadWritingFormTemplateDraft,
  loadWritingFormTemplateSave,
  persistWritingFormTemplateDraft,
} from './writing-form-template-local-save'

const TEMPLATE_ID = 'registration-general'

function stubLocalStorage() {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key]
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  })
}

describe('program registration local-only draft', () => {
  beforeEach(() => {
    stubLocalStorage()
    vi.mocked(loadFormTemplateVersionDraft).mockReset()
    vi.mocked(saveFormTemplateVersionDraft).mockReset()
  })

  it('saves and loads only localStorage without form-template API', async () => {
    const draft = createProgramRegistrationDraft('general')

    await persistWritingFormTemplateDraft({
      templateId: TEMPLATE_ID,
      draft,
      editorState: { programTitleKo: '로컬 임시저장' },
      localOnly: true,
    })

    const loaded = await loadWritingFormTemplateDraft(TEMPLATE_ID, { localOnly: true })

    expect(loaded?.editorState).toEqual({ programTitleKo: '로컬 임시저장' })
    expect(loadWritingFormTemplateSave(TEMPLATE_ID)).not.toBeNull()
    expect(saveFormTemplateVersionDraft).not.toHaveBeenCalled()
    expect(loadFormTemplateVersionDraft).not.toHaveBeenCalled()
  })

  it('rejects catalog registration original remote persist', async () => {
    const draft = createProgramRegistrationDraft('general')
    await expect(
      persistWritingFormTemplateDraft({
        templateId: TEMPLATE_ID,
        draft,
      })
    ).rejects.toThrow(/CATALOG 원본/)
    expect(saveFormTemplateVersionDraft).not.toHaveBeenCalled()
  })

  it('round-trips the UJAT typed common-info snapshot inside editorState', async () => {
    const draft = createProgramRegistrationDraft('general')
    const ujatBasicInfo = {
      mainTitle: 'UJAT RHF 대표명',
      titleEn: 'UJAT Representative',
      surveySurvey: false,
      generalParticipantTypes: ['school_institution', 'volunteer'],
    }

    await persistWritingFormTemplateDraft({
      templateId: 'registration-wizard:UJAT:registration-ujat',
      draft,
      overlay: { 'ujat.h1.event.name': '상반기 본교육' },
      editorState: { ujatBasicInfo },
      localOnly: true,
    })

    const loaded = await loadWritingFormTemplateDraft('registration-wizard:UJAT:registration-ujat', {
      localOnly: true,
    })

    expect(loaded?.editorState?.ujatBasicInfo).toEqual(ujatBasicInfo)
    expect(loaded?.overlay).toEqual({ 'ujat.h1.event.name': '상반기 본교육' })
  })
})
