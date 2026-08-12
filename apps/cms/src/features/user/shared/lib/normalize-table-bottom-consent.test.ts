import { describe, expect, it } from 'vitest'
import {
  createAgreementPortraitDraft,
  normalizeVerticalTableParagraph,
  normalizeTableBottomConsent,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { normalizeMemberConsentWriteDraft } from '@/features/user/shared/lib/normalize-member-consent-write-draft'

describe('normalizeTableBottomConsent', () => {
  it('preserves unset values instead of defaulting to agree', () => {
    expect(normalizeTableBottomConsent(undefined)).toBeUndefined()
    expect(normalizeTableBottomConsent(null)).toBeUndefined()
    expect(normalizeTableBottomConsent('agree')).toBe('agree')
    expect(normalizeTableBottomConsent('disagree')).toBe('disagree')
  })
})

describe('member consent write draft + table normalize', () => {
  it('keeps bottomConsent unset after vertical table render normalize', () => {
    const draft = normalizeMemberConsentWriteDraft(
      normalizeWritingFormDraft(createAgreementPortraitDraft()),
      'agreement-portrait'
    )

    const table = draft.paragraphs.find(
      p => p.id === 'agreement-portrait-personal-consent-table'
    )
    expect(table?.kind === 'single_item' && table.variant === 'vertical_table').toBe(true)
    if (table?.kind !== 'single_item' || table.variant !== 'vertical_table') return

    expect(table.bottomConsent).toBeUndefined()

    const normalizedForRender = normalizeVerticalTableParagraph(table)
    expect(normalizedForRender.bottomConsent).toBeUndefined()
  })
})
