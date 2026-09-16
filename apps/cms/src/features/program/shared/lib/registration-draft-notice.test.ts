/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import {
  clearRegistrationDraftForFreshStart,
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
} from './registration-draft-notice'

describe('clearRegistrationDraftForFreshStart', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes only the local draft synchronously', () => {
    persistWritingFormTemplateSave({
      templateId: PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
      draft: createProgramRegistrationDraft('general'),
      editorState: { programTitleKo: '임시 프로그램' },
    })

    clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)

    expect(loadWritingFormTemplateSave(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)).toBeNull()
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
