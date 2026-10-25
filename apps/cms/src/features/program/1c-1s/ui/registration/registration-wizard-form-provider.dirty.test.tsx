/** @vitest-environment jsdom */
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { peekCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import { CompanySchoolRegistrationWizardFormProvider } from './registration-wizard-form-provider'

describe('C8 1사1교 applyOverlayRecord dirty 의미', () => {
  afterEach(() => cleanup())

  async function mount() {
    render(
      <CompanySchoolRegistrationWizardFormProvider>
        <div />
      </CompanySchoolRegistrationWizardFormProvider>
    )
    await waitFor(() => expect(peekCompanySchoolRegistrationRhf()).not.toBeNull())
    return peekCompanySchoolRegistrationRhf()!
  }

  it('shouldDirty:true면 적용한 값이 dirty로 잡힌다', async () => {
    const api = await mount()
    expect(api.isDirty()).toBe(false)
    act(() => {
      api.applyOverlayRecord({ 'economyRegistration.basicInfo.repKo': '변경' }, { shouldDirty: true })
    })
    await waitFor(() => expect(api.isDirty()).toBe(true))
    expect(api.getValues().repKo).toBe('변경')
  })

  it('shouldDirty:false면 적용으로 dirty를 만들지 않는다', async () => {
    const api = await mount()
    act(() => {
      api.applyOverlayRecord({ 'economyRegistration.basicInfo.repKo': '복원' }, { shouldDirty: false })
    })
    expect(api.getValues().repKo).toBe('복원')
    expect(api.isDirty()).toBe(false)
  })
})
