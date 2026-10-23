/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  peekGeneralRegistrationWizardRhf,
  registerGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { COMMON_INFO_PERSIST_KEYS as K } from '@/features/program/general/lib/overlay-phase1/common-info-persist-keys'
import { hydrateRegistrationWizardUiValues } from '@/features/program/general/lib/overlay-phase1/registration-wizard-legacy-hydrate'
import { REGISTRATION_WIZARD_RHF_SETTINGS_KEY } from '@/features/program/general/lib/overlay-phase1/registration-wizard-ui-values'
import {
  getProgramRegistrationOverlayRecord,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlayStoreForTests,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { GeneralRegistrationWizardFormProvider } from './registration-wizard-form-provider'

function OverlayTitleProbe() {
  const [value, setValue] = useProgramRegistrationOverlayKv(K.programTitleKo, '')
  return (
    <div>
      <span data-testid="title">{value}</span>
      <button type="button" onClick={() => setValue('RHF 입력')}>
        set
      </button>
    </div>
  )
}

describe('GeneralRegistrationWizardFormProvider', () => {
  afterEach(() => {
    cleanup()
    registerGeneralRegistrationWizardRhf(null)
    resetProgramRegistrationOverlayStoreForTests()
  })

  it('일반 Provider가 있으면 overlay kv가 RHF를 읽고 쓴다', async () => {
    render(
      <GeneralRegistrationWizardFormProvider>
        <OverlayTitleProbe />
      </GeneralRegistrationWizardFormProvider>
    )
    await waitFor(() => {
      expect(peekGeneralRegistrationWizardRhf()).not.toBeNull()
    })
    fireEvent.click(document.querySelector('button') as HTMLButtonElement)
    await waitFor(() => {
      expect(peekGeneralRegistrationWizardRhf()?.getValues().programTitleKo).toBe('RHF 입력')
      expect(peekGeneralRegistrationWizardRhf()?.isDirty()).toBe(true)
    })
    expect(getProgramRegistrationOverlayRecord()[K.programTitleKo]).toBe('RHF 입력')
  })

  it('Provider가 없으면 overlay store가 정본이다', async () => {
    render(<OverlayTitleProbe />)
    expect(peekGeneralRegistrationWizardRhf()).toBeNull()
    fireEvent.click(document.querySelector('button') as HTMLButtonElement)
    await waitFor(() => {
      expect(getProgramRegistrationOverlayRecord()[K.programTitleKo]).toBe('RHF 입력')
    })
  })

  it('임시저장 후 이어서 작성 시 빈 editorState가 국문 대표명을 지우지 않는다', async () => {
    render(
      <GeneralRegistrationWizardFormProvider>
        <OverlayTitleProbe />
      </GeneralRegistrationWizardFormProvider>
    )
    await waitFor(() => {
      expect(peekGeneralRegistrationWizardRhf()).not.toBeNull()
    })
    fireEvent.click(document.querySelector('button') as HTMLButtonElement)
    await waitFor(() => {
      expect(peekGeneralRegistrationWizardRhf()?.getValues().programTitleKo).toBe('RHF 입력')
    })

    const rhf = peekGeneralRegistrationWizardRhf()
    expect(rhf).not.toBeNull()
    const savedOverlay = { [K.programTitleKo]: rhf!.getValues().programTitleKo }
    const savedSettings = {
      [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: rhf!.getValues(),
    }

    replaceProgramRegistrationOverlay(savedOverlay)
    rhf!.reset(
      hydrateRegistrationWizardUiValues({
        overlay: savedOverlay,
        editorState: { programTitleKo: '' } as never,
        settingsJson: savedSettings,
      }),
      { keepDirty: false }
    )

    expect(peekGeneralRegistrationWizardRhf()?.getValues().programTitleKo).toBe('RHF 입력')
  })
})
