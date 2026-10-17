import { afterEach, describe, expect, it } from 'vitest'
import {
  hasSponsorOrDetailedProgramInOverlay,
} from '@/features/template/ui/form-set/registration-form/shared/registration-catalog-prefetch'
import {
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

afterEach(() => {
  resetProgramRegistrationOverlay()
})

describe('hasSponsorOrDetailedProgramInOverlay', () => {
  it('general localSponsorIds가 있으면 true', () => {
    replaceProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localSponsorIds': ['163001'],
    })
    expect(hasSponsorOrDetailedProgramInOverlay('generalRegistration.basicInfo')).toBe(true)
  })

  it('economy sponsorId __all__는 false', () => {
    replaceProgramRegistrationOverlay({
      'economyRegistration.basicInfo.sponsorId': '__all__',
    })
    expect(hasSponsorOrDetailedProgramInOverlay('economyRegistration.basicInfo')).toBe(false)
  })
})
