/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlayStoreForTests,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import { createDefaultCompanySchoolRegistrationRhfValues } from '@/features/program/1c-1s/lib/registration-rhf-values'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import {
  registerGeneralRegistrationWizardRhf,
  type GeneralRegistrationWizardRhfApi,
} from './registration-wizard-rhf-api'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'

function generalApi(): GeneralRegistrationWizardRhfApi {
  const values = createDefaultRegistrationWizardUiValues()
  return {
    getValues: () => values,
    getPath: () => undefined,
    setPath: vi.fn(),
    reset: vi.fn(),
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
  }
}

function csApi(): CompanySchoolRegistrationRhfApi {
  const values = createDefaultCompanySchoolRegistrationRhfValues()
  return {
    getValues: () => values,
    getPath: () => undefined,
    setPath: vi.fn(),
    reset: vi.fn(),
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
  }
}

describe('C3 1사1교 활성 중 일반 RHF 라우팅 금지', () => {
  afterEach(() => {
    registerGeneralRegistrationWizardRhf(null)
    registerCompanySchoolRegistrationRhf(null)
    resetProgramRegistrationOverlayStoreForTests()
  })

  it('patch: rest 키는 store에만 쓰고 일반 RHF setPath를 부르지 않는다', () => {
    const general = generalApi()
    registerGeneralRegistrationWizardRhf(general)
    registerCompanySchoolRegistrationRhf(csApi())
    patchProgramRegistrationOverlay({ [K.programTitleKo]: '일반키' })
    expect(general.setPath).not.toHaveBeenCalled()
    expect(getProgramRegistrationOverlayRecord()[K.programTitleKo]).toBe('일반키')
  })

  it('replace: 공통정보는 1사1교 RHF로, rest는 일반 RHF에 적용하지 않는다', () => {
    const general = generalApi()
    const cs = csApi()
    registerGeneralRegistrationWizardRhf(general)
    registerCompanySchoolRegistrationRhf(cs)
    replaceProgramRegistrationOverlay(
      { 'economyRegistration.basicInfo.repKo': 'R', [K.programTitleKo]: '일반키' },
      { shouldDirty: false }
    )
    expect(cs.applyOverlayRecord).toHaveBeenCalledWith(
      { 'economyRegistration.basicInfo.repKo': 'R' },
      { shouldDirty: false }
    )
    expect(general.applyOverlayRecord).not.toHaveBeenCalled()
    expect(getProgramRegistrationOverlayRecord()[K.programTitleKo]).toBe('일반키')
  })
})
