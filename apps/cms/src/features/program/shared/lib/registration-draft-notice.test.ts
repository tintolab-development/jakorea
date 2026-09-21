/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
} from './registration-draft-notice'
import { persistWritingFormTemplateSave } from '@/features/program/shared/lib/program-draft-local-save'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

vi.mock('@/features/program/general/lib/registration-program-draft-session', () => ({
  deleteRegistrationProgramDraftRemote: vi.fn(async () => undefined),
}))

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

describe('clearRegistrationDraftForFreshStart', () => {
  beforeEach(() => {
    stubLocalStorage()
    vi.clearAllMocks()
  })

  it('removes localStorage draft and leftover remote program-draft', async () => {
    const { deleteRegistrationProgramDraftRemote } = await import(
      '@/features/program/general/lib/registration-program-draft-session'
    )
    const { clearRegistrationDraftForFreshStart, fetchRegistrationDraftNotice } = await import(
      './registration-draft-notice'
    )

    persistWritingFormTemplateSave({
      templateId: PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
      draft: createProgramRegistrationDraft('general'),
      editorState: { programTitleKo: '로컬제목' },
    })

    await clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)

    expect(deleteRegistrationProgramDraftRemote).toHaveBeenCalledWith('GENERAL')
    await expect(
      fetchRegistrationDraftNotice(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)
    ).resolves.toBeNull()
  })
})

describe('fetchRegistrationDraftNotice', () => {
  beforeEach(() => {
    stubLocalStorage()
  })

  it('reads title from localStorage, not program-draft API', async () => {
    const { fetchRegistrationDraftNotice } = await import('./registration-draft-notice')
    persistWritingFormTemplateSave({
      templateId: PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE,
      draft: createProgramRegistrationDraft('trainedTeachers'),
      editorState: { programTitleKo: '가나다(교육받은교사)' },
    })

    await expect(
      fetchRegistrationDraftNotice(PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE)
    ).resolves.toEqual(
      expect.objectContaining({
        templateCode: PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE,
        title: '가나다(교육받은교사)',
      })
    )
  })
})

describe('shouldSkipRegistrationDraftRestore', () => {
  it('restores only after explicit continue selection', () => {
    expect(shouldSkipRegistrationDraftRestore(REGISTRATION_DRAFT_MODE_CONTINUE)).toBe(false)
    expect(shouldSkipRegistrationDraftRestore(REGISTRATION_DRAFT_MODE_FRESH)).toBe(true)
    expect(shouldSkipRegistrationDraftRestore(null)).toBe(true)
  })
})

describe('shouldRemoveRegistrationDraftAfterCompletion', () => {
  it('removes only a continued draft after successful completion', () => {
    expect(
      shouldRemoveRegistrationDraftAfterCompletion(REGISTRATION_DRAFT_MODE_CONTINUE)
    ).toBe(true)
    expect(shouldRemoveRegistrationDraftAfterCompletion(REGISTRATION_DRAFT_MODE_FRESH)).toBe(
      false
    )
    expect(shouldRemoveRegistrationDraftAfterCompletion(null)).toBe(false)
  })
})
