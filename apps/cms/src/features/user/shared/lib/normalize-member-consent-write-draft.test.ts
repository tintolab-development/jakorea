import { describe, expect, it } from 'vitest'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { normalizeMemberConsentWriteDraft } from '@/features/user/shared/lib/normalize-member-consent-write-draft'

describe('normalizeMemberConsentWriteDraft', () => {
  it('clears bottomConsent and multiple-choice defaults for educator pledge', () => {
    const draft = normalizeMemberConsentWriteDraft(
      createEducatorFacilitatorPledgeDraft(),
      'agreement-expense'
    )

    for (const paragraph of draft.paragraphs) {
      if ('showBottomConsent' in paragraph && paragraph.showBottomConsent === true) {
        expect(
          (paragraph as { bottomConsent?: string }).bottomConsent
        ).toBeUndefined()
      }
      if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
        expect(paragraph.selectedPreviewSingleId).toBeNull()
        expect(paragraph.selectedPreviewMultipleIds).toEqual([])
      }
    }
  })

  it('clears portrait personal consent table first row', () => {
    const draft = normalizeMemberConsentWriteDraft(
      createAgreementPortraitDraft(),
      'agreement-portrait'
    )

    const table = draft.paragraphs.find(p => p.id === 'agreement-portrait-personal-consent-table')
    expect(table?.kind === 'single_item' && table.variant === 'vertical_table' && table.rows[0]).toEqual(
      expect.objectContaining({
        cells: ['', ''],
      })
    )
  })

  it('clears notice subject fields and id type selection', () => {
    const draft = normalizeMemberConsentWriteDraft(
      normalizeWritingFormDraft(createAgreementNoticeDraft()),
      'agreement-notice'
    )

    const subject = draft.paragraphs.find(p => p.id === 'agreement-notice-subject')
    expect(subject?.kind === 'single_item' && subject.variant === 'short_essay' && subject.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'agreement-notice-subj-name', bodyText: '' }),
        expect.objectContaining({ id: 'agreement-notice-subj-birth', bodyText: '' }),
        expect.objectContaining({ id: 'agreement-notice-subj-phone', bodyText: '' }),
      ])
    )

    const purpose = draft.paragraphs.find(p => p.id === 'agreement-notice-purpose')
    expect(
      purpose?.kind === 'single_item' &&
        purpose.variant === 'agreement_explanation_text' &&
        purpose.bodyText
    ).toBe('')

    const table = draft.paragraphs.find(p => p.id === 'agreement-notice-table')
    expect(
      table?.kind === 'single_item' &&
        table.variant === 'horizontal_table' &&
        table.idTypeWithInput?.selectedOptionId
    ).toBeNull()
    expect(
      table?.kind === 'single_item' &&
        table.variant === 'horizontal_table' &&
        table.idTypeWithInput?.inputValue
    ).toBe('')
  })
})
