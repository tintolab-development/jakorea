/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlayStoreForTests,
  updateProgramRegistrationOverlayKey,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import {
  registerGeneralRegistrationWizardRhf,
  type GeneralRegistrationWizardRhfApi,
} from './registration-wizard-rhf-api'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'

function mockApi(overrides: Partial<GeneralRegistrationWizardRhfApi> = {}): GeneralRegistrationWizardRhfApi {
  const values = createDefaultRegistrationWizardUiValues()
  return {
    getValues: () => values,
    getPath: () => undefined,
    setPath: vi.fn(),
    reset: vi.fn(),
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
    ...overrides,
  }
}

describe('registration wizard overlay intercept', () => {
  afterEach(() => {
    registerGeneralRegistrationWizardRhf(null)
    resetProgramRegistrationOverlayStoreForTests()
  })

  it('overlay patch는 RHF setPath로 투영하고 shouldDirty true', () => {
    const api = mockApi()
    registerGeneralRegistrationWizardRhf(api)
    patchProgramRegistrationOverlay({ [K.programTitleKo]: '제목' })
    expect(api.setPath).toHaveBeenCalledWith('programTitleKo', '제목', { shouldDirty: true })
  })

  it('replace는 applyOverlayRecord로 일괄 투영한다', () => {
    const api = mockApi()
    registerGeneralRegistrationWizardRhf(api)
    replaceProgramRegistrationOverlay({ [K.programTitleKo]: '복원' }, { shouldDirty: false })
    expect(api.applyOverlayRecord).toHaveBeenCalledWith(
      { [K.programTitleKo]: '복원' },
      { shouldDirty: false }
    )
  })

  it('RHF가 없으면 overlay store만 갱신한다', () => {
    updateProgramRegistrationOverlayKey(K.programTitleKo, () => 'economy')
    expect(getProgramRegistrationOverlayRecord()[K.programTitleKo]).toBe('economy')
  })
})
