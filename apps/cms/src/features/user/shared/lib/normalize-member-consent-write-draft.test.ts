import { describe, expect, it } from 'vitest'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { createPaymentStatementPreConsentDraft } from '@/features/template/model/payment-statement-pre-consent-draft'
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

  it('keeps notice purpose text and locks id type to resident registration number', () => {
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

    const institution = draft.paragraphs.find(p => p.id === 'agreement-notice-institution')
    expect(
      institution?.kind === 'single_item' &&
        institution.variant === 'agreement_explanation_text' &&
        institution.bodyText
    ).toBe('')

    const purpose = draft.paragraphs.find(p => p.id === 'agreement-notice-purpose')
    expect(
      purpose?.kind === 'single_item' &&
        purpose.variant === 'agreement_explanation_text' &&
        purpose.bodyText
    ).toBe('범죄경력 유무 조회')

    const table = draft.paragraphs.find(p => p.id === 'agreement-notice-table')
    expect(
      table?.kind === 'single_item' &&
        table.variant === 'horizontal_table' &&
        table.idTypeWithInput?.selectedOptionId
    ).toBe('agreement-notice-id-resident')
    expect(
      table?.kind === 'single_item' &&
        table.variant === 'horizontal_table' &&
        table.idTypeWithInput?.inputValue
    ).toBe('')
  })

  it('resets notice institution to empty and purpose to the default on write entry', () => {
    const base = normalizeWritingFormDraft(createAgreementNoticeDraft())
    const dirty: typeof base = {
      ...base,
      paragraphs: base.paragraphs.map(paragraph => {
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'agreement_explanation_text') {
          return paragraph
        }
        if (paragraph.id === 'agreement-notice-institution') {
          return { ...paragraph, bodyText: '저장된 기관명' }
        }
        if (paragraph.id === 'agreement-notice-purpose') {
          return { ...paragraph, bodyText: '다른 목적' }
        }
        return paragraph
      }),
    }

    const draft = normalizeMemberConsentWriteDraft(dirty, 'agreement-notice')
    const institution = draft.paragraphs.find(p => p.id === 'agreement-notice-institution')
    const purpose = draft.paragraphs.find(p => p.id === 'agreement-notice-purpose')

    expect(
      institution?.kind === 'single_item' &&
        institution.variant === 'agreement_explanation_text' &&
        institution.bodyText
    ).toBe('')
    expect(
      purpose?.kind === 'single_item' &&
        purpose.variant === 'agreement_explanation_text' &&
        purpose.bodyText
    ).toBe('범죄경력 유무 조회')
  })

  it('지급조서 — overlay 시드 표의 bottomConsent(동의)를 작성 진입 시 비운다', () => {
    const draft = normalizeMemberConsentWriteDraft(
      createPaymentStatementPreConsentDraft(),
      'agreement-third-party'
    )

    const consentTables = draft.paragraphs.filter(
      p =>
        p.kind === 'single_item' &&
        p.variant === 'horizontal_table' &&
        p.showBottomConsent === true
    )
    expect(consentTables.length).toBeGreaterThan(0)
    for (const paragraph of consentTables) {
      expect((paragraph as { bottomConsent?: string }).bottomConsent).toBeUndefined()
    }
  })
})
