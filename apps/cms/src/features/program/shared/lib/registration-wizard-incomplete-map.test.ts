import { describe, expect, it } from 'vitest'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { resolveRegistrationWizardIncompleteParagraphIds } from '@/features/program/shared/lib/registration-wizard-incomplete-map'

describe('resolveRegistrationWizardIncompleteParagraphIds', () => {
  it('maps program phase keys to seed paragraph ids', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['kpi.instructor', 'basicInfo.programTitleKo'],
      'general'
    )
    expect(ids.has(PROGRAM_REGISTRATION_IDS.businessKpi)).toBe(true)
    expect(ids.has(PROGRAM_REGISTRATION_IDS.basicInfo)).toBe(true)
  })

  it('maps third party application cell keys to paragraph id', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['application.thirdParty.program-application-institution-seed-third-party.0.2'],
      'general'
    )
    expect(ids.has('program-application-institution-seed-third-party')).toBe(true)
  })
})
