/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
} from './registration-draft-notice'

vi.mock('@/features/program/general/lib/registration-program-draft-session', () => ({
  deleteRegistrationProgramDraftRemote: vi.fn(async () => undefined),
}))

vi.mock('@/features/program/general/lib/registration-create-form-bindings-capabilities', () => ({
  shouldUseRegistrationCreateFormBindings: vi.fn(() => true),
  assertRegistrationWizardRemoteReady: vi.fn(),
}))

describe('clearRegistrationDraftForFreshStart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes remote program-draft', async () => {
    const { deleteRegistrationProgramDraftRemote } = await import(
      '@/features/program/general/lib/registration-program-draft-session'
    )
    const { clearRegistrationDraftForFreshStart } = await import('./registration-draft-notice')

    await clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)

    expect(deleteRegistrationProgramDraftRemote).toHaveBeenCalledWith('GENERAL')
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
