import { describe, expect, it } from 'vitest'
import {
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS,
  UJAT_PROGRAM_REGISTRATION_STEP_KEYS,
  UJAT_PROGRAM_REGISTRATION_STEPS,
  getUjatProgramRegistrationPhase,
  normalizeUjatProgramRegistrationStepKey,
  recruitmentPreviewAudienceFromUjatRegistrationStep,
} from './ujat-program-registration-flow'

describe('ujat-program-registration-flow', () => {
  it('wizard steps are program + recruitment only', () => {
    expect([...UJAT_PROGRAM_REGISTRATION_STEP_KEYS]).toEqual([
      'program',
      'recruit-participant',
      'recruit-volunteer-h1',
      'recruit-volunteer-h2',
    ])
    expect(UJAT_PROGRAM_REGISTRATION_STEPS.map(step => step.phase)).toEqual([
      'program',
      'recruitment',
      'recruitment',
      'recruitment',
    ])
  })

  it('keeps fixed application template ids for bindings', () => {
    expect([...UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS]).toEqual([
      'application-ujat-school',
      'application-ujat-volunteer',
    ])
  })

  it('maps legacy application query/draft steps to recruitment', () => {
    expect(normalizeUjatProgramRegistrationStepKey('application-school')).toBe(
      'recruit-participant'
    )
    expect(normalizeUjatProgramRegistrationStepKey('application-volunteer')).toBe(
      'recruit-participant'
    )
    expect(getUjatProgramRegistrationPhase('recruit-participant')).toBe('recruitment')
  })

  it('maps recruit steps to platform preview audiences', () => {
    expect(recruitmentPreviewAudienceFromUjatRegistrationStep('recruit-participant')).toBe(
      'institutions'
    )
    expect(recruitmentPreviewAudienceFromUjatRegistrationStep('recruit-volunteer-h1')).toBe(
      'volunteers'
    )
    expect(recruitmentPreviewAudienceFromUjatRegistrationStep('recruit-volunteer-h2')).toBe(
      'volunteers'
    )
  })
})
