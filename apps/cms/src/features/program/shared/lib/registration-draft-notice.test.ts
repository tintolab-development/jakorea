/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  fetchRegistrationDraftNotice,
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
  clearRegistrationDraftForFreshStart,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
} from './registration-draft-notice'
import {
  peekRegistrationProgramDraftPayload,
  syncRegistrationProgramDraftSession,
} from '@/features/program/general/lib/registration-program-draft-session'

describe('clearRegistrationDraftForFreshStart', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deletes only the local program draft', async () => {
    syncRegistrationProgramDraftSession({
      programType: 'GENERAL',
      registrationTemplateCode: PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
      activeStep: 'program',
    })

    await clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)

    expect(peekRegistrationProgramDraftPayload('GENERAL')).toBeUndefined()
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

describe('fetchRegistrationDraftNotice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('treats program-step temp save as user draft', async () => {
    syncRegistrationProgramDraftSession({
      programType: 'GENERAL',
      registrationTemplateCode: 'registration-general',
      activeStep: 'program',
    })

    const notice = await fetchRegistrationDraftNotice(
      PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE
    )

    expect(notice?.templateCode).toBe(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)
    expect(notice?.title).toBe('제목 없음')
    expect(notice?.savedAt).toBeTruthy()
  })

  it('returns null without a local temp save', async () => {
    await expect(
      fetchRegistrationDraftNotice(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)
    ).resolves.toBeNull()
  })
})