import { describe, expect, it } from 'vitest'
import { AGREEMENT_PORTRAIT_PARAGRAPH_IDS, createAgreementPortraitDraft } from '@/features/template/model/writing-form-draft.schema'
import { applyMemberPortraitConsentPrefill } from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import { INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS } from '@/features/user/shared/lib/instructor-portrait-consent-affiliation-options'
import { resolvePortraitAffiliationSelectOptions } from '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-affiliation-options'

describe('applyMemberPortraitConsentPrefill', () => {
  it('leaves affiliation empty when instructor portrait select options are provided', () => {
    const draft = applyMemberPortraitConsentPrefill(createAgreementPortraitDraft(), {
      name: '홍길동',
      schoolEnrollmentStatus: 'not_enrolled',
      portraitAffiliationSelectOptions: INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS,
    })

    const table = draft.paragraphs.find(p => p.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable)
    expect(table?.kind).toBe('single_item')
    if (table?.kind !== 'single_item' || table.variant !== 'vertical_table') return

    expect(table.rows[0]?.cells).toEqual(['홍길동', ''])
  })
})

describe('resolvePortraitAffiliationSelectOptions', () => {
  it('returns instructor affiliation options', () => {
    expect(
      resolvePortraitAffiliationSelectOptions('', INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS)
    ).toEqual([...INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS])
  })
})
