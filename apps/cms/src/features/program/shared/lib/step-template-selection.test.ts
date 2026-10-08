import { afterEach, describe, expect, it } from 'vitest'
import {
  clearRegistrationStepTemplateSelections,
  getSelectedOperationalTemplateCode,
  hydrateRegistrationStepTemplateSelections,
  isDefaultOperationalTemplateSelection,
  registrationStepTemplateSelectionKey,
  setRegistrationStepTemplateSelection,
} from './step-template-selection'

describe('step-template-selection', () => {
  afterEach(() => {
    clearRegistrationStepTemplateSelections()
  })

  it('returns default until a tab selection is stored', () => {
    expect(
      getSelectedOperationalTemplateCode(
        'GENERAL',
        'recruit-participant-school',
        'recruitment-participant-school'
      )
    ).toBe('recruitment-participant-school')
  })

  it('stores and restores a non-default selection by step', () => {
    setRegistrationStepTemplateSelection(
      'GENERAL',
      'recruit-participant-school',
      'recruitment-instructor'
    )
    expect(
      getSelectedOperationalTemplateCode(
        'GENERAL',
        'recruit-participant-school',
        'recruitment-participant-school'
      )
    ).toBe('recruitment-instructor')
  })

  it('shares UJAT volunteer h1/h2 selection', () => {
    expect(registrationStepTemplateSelectionKey('UJAT', 'recruit-volunteer-h1')).toBe(
      'recruit-volunteer'
    )
    setRegistrationStepTemplateSelection('UJAT', 'recruit-volunteer-h1', 'recruitment-volunteer')
    expect(
      getSelectedOperationalTemplateCode(
        'UJAT',
        'recruit-volunteer-h2',
        'recruitment-ujat-volunteer'
      )
    ).toBe('recruitment-volunteer')
  })

  it('hydrates from draft payload', () => {
    hydrateRegistrationStepTemplateSelections('GENERAL', {
      'recruit-participant-school': 'recruitment-economy',
    })
    expect(
      getSelectedOperationalTemplateCode(
        'GENERAL',
        'recruit-participant-school',
        'recruitment-participant-school'
      )
    ).toBe('recruitment-economy')
  })

  it('treats only the exact default code as <기본>', () => {
    expect(
      isDefaultOperationalTemplateSelection(
        'recruitment-participant-school',
        'recruitment-participant-school'
      )
    ).toBe(true)
    expect(
      isDefaultOperationalTemplateSelection(
        'recruitment-participant-school-copy-1',
        'recruitment-participant-school'
      )
    ).toBe(false)
    expect(
      isDefaultOperationalTemplateSelection(
        'recruitment-instructor',
        'recruitment-participant-school'
      )
    ).toBe(false)
  })
})
