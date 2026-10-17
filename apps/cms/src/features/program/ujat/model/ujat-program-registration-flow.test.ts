import { describe, expect, it } from 'vitest'
import {
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS,
  UJAT_PROGRAM_REGISTRATION_STEP_KEYS,
  UJAT_PROGRAM_REGISTRATION_STEPS,
  getUjatProgramRegistrationPhase,
  getUjatProgramRegistrationPhaseValidationTarget,
  normalizeUjatProgramRegistrationStepKey,
  recruitmentPreviewAudienceFromUjatRegistrationStep,
} from './ujat-program-registration-flow'

describe('ujat-program-registration-flow', () => {
  it('wizard steps are program + recruitment + application', () => {
    expect([...UJAT_PROGRAM_REGISTRATION_STEP_KEYS]).toEqual([
      'program',
      'recruit-participant',
      'recruit-volunteer-h1',
      'recruit-volunteer-h2',
      'application-ujat-school',
      'application-ujat-volunteer',
    ])
    expect(UJAT_PROGRAM_REGISTRATION_STEPS.map(step => step.phase)).toEqual([
      'program',
      'recruitment',
      'recruitment',
      'recruitment',
      'application',
      'application',
    ])
  })

  it('keeps fixed application template ids for bindings', () => {
    expect([...UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS]).toEqual([
      'application-ujat-school',
      'application-ujat-volunteer',
    ])
  })

  it('maps legacy application query/draft steps to application tabs', () => {
    expect(normalizeUjatProgramRegistrationStepKey('application-school')).toBe(
      'application-ujat-school'
    )
    expect(normalizeUjatProgramRegistrationStepKey('application-volunteer')).toBe(
      'application-ujat-volunteer'
    )
    expect(getUjatProgramRegistrationPhase('recruit-participant')).toBe('recruitment')
    expect(getUjatProgramRegistrationPhase('application-ujat-school')).toBe('application')
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

  it('uses the common-information gate before entering recruitment', () => {
    expect(getUjatProgramRegistrationPhaseValidationTarget('program', 'recruitment')).toBe(
      'program'
    )
  })

  it('uses the recruitment gate before entering application', () => {
    expect(getUjatProgramRegistrationPhaseValidationTarget('recruitment', 'application')).toBe(
      'recruitment'
    )
  })

  it('does not validate when moving backwards or within the same phase', () => {
    expect(getUjatProgramRegistrationPhaseValidationTarget('application', 'recruitment')).toBeNull()
    expect(getUjatProgramRegistrationPhaseValidationTarget('recruitment', 'recruitment')).toBeNull()
  })
})
