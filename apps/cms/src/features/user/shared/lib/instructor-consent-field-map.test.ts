import { describe, expect, it } from 'vitest'
import {
  isAgreementInstructorConsentField,
  isInstructorCrimeConsentField,
  resolveInstructorConsentTemplateEntry,
} from '@/features/user/shared/lib/instructor-consent-field-map'

describe('resolveInstructorConsentTemplateEntry', () => {
  it('maps instructor consent fields to agreement template ids', () => {
    expect(resolveInstructorConsentTemplateEntry('consentPortrait').templateId).toBe(
      'agreement-portrait'
    )
    expect(resolveInstructorConsentTemplateEntry('consentPaymentStatement').templateId).toBe(
      'agreement-third-party'
    )
    expect(resolveInstructorConsentTemplateEntry('consentEducatorPledge').templateId).toBe(
      'agreement-expense'
    )
    expect(resolveInstructorConsentTemplateEntry('consentAdministrativeJoint').templateId).toBe(
      'agreement-notice'
    )
    expect(resolveInstructorConsentTemplateEntry('consentSexOffenseCheck').templateId).toBe(
      'agreement-crime'
    )
  })
})

describe('instructor consent field guards', () => {
  it('classifies crime consent separately from agreement modals', () => {
    expect(isInstructorCrimeConsentField('consentSexOffenseCheck')).toBe(true)
    expect(isInstructorCrimeConsentField('consentPortrait')).toBe(false)
    expect(isAgreementInstructorConsentField('consentPortrait')).toBe(true)
    expect(isAgreementInstructorConsentField('consentSexOffenseCheck')).toBe(false)
  })
})
