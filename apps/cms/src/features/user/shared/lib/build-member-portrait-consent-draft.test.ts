import { describe, expect, it } from 'vitest'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  applyEducatorFacilitatorPledgeDefaultAgree,
  applyMemberNoticeConsentPrefill,
  applyMemberPortraitConsentPrefill,
} from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import { INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS } from '@/features/user/shared/lib/instructor-portrait-consent-affiliation-options'

describe('applyMemberPortraitConsentPrefill', () => {
  it('prefills affiliation from instructor basic info even with portrait select options', () => {
    const draft = applyMemberPortraitConsentPrefill(createAgreementPortraitDraft(), {
      name: '홍길동',
      schoolEnrollmentStatus: 'enrolled',
      schoolName: '○○고등학교',
      portraitAffiliationSelectOptions: INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS,
    })

    const table = draft.paragraphs.find(p => p.id === 'agreement-portrait-personal-consent-table')
    expect(table?.kind === 'single_item' && table.variant === 'vertical_table' && table.rows[0]).toEqual(
      expect.objectContaining({
        cells: ['홍길동', '○○고등학교'],
      })
    )
  })
})

describe('applyMemberNoticeConsentPrefill', () => {
  it('prefills subject paragraph from member context', () => {
    const draft = applyMemberNoticeConsentPrefill(normalizeWritingFormDraft(createAgreementNoticeDraft()), {
      name: '김필수',
      birthDate: '1997.07.21',
      phone: '010-1234-5678',
      schoolEnrollmentStatus: 'not_enrolled',
    })

    const subject = draft.paragraphs.find(p => p.id === 'agreement-notice-subject')
    expect(subject?.kind === 'single_item' && subject.variant === 'short_essay' && subject.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'agreement-notice-subj-name', bodyText: '김필수' }),
        expect.objectContaining({ id: 'agreement-notice-subj-birth', bodyText: '19970721' }),
        expect.objectContaining({ id: 'agreement-notice-subj-phone', bodyText: '010-1234-5678' }),
      ])
    )
  })
})

describe('applyEducatorFacilitatorPledgeDefaultAgree', () => {
  it('selects agree for all pledge multiple-choice clauses by default', () => {
    const draft = applyEducatorFacilitatorPledgeDefaultAgree(createEducatorFacilitatorPledgeDraft())
    const clauses = draft.paragraphs.filter(
      paragraph => paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice'
    )

    expect(clauses.length).toBeGreaterThan(0)
    for (const paragraph of clauses) {
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') continue
      const selected = paragraph.items.find(item => item.id === paragraph.selectedPreviewSingleId)
      expect(selected?.label).toBe('동의')
    }
  })
})
