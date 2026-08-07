import { describe, expect, it } from 'vitest'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { applyMemberPortraitConsentPrefill } from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import { INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS } from '@/features/user/shared/lib/instructor-portrait-consent-affiliation-options'
import {
  hasMemberConsentDisagreement,
  hasMemberConsentIncompleteRequiredFields,
} from '@/features/user/shared/lib/validate-member-consent-draft'

function withPersonalConsentCells(
  draft: WritingFormDraft,
  name: string,
  affiliation: string
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable) {
        return paragraph
      }
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'vertical_table') {
        return paragraph
      }
      const rows = [...paragraph.rows]
      const first = rows[0]
      if (first == null) return paragraph
      rows[0] = {
        stageCount: 2,
        cells: [name, affiliation],
        headers:
          first.stageCount === 2
            ? first.headers
            : [first.headers[0] ?? '성명', '소속'],
      }
      return { ...paragraph, rows }
    }),
  }
}

function withBottomConsent(
  draft: WritingFormDraft,
  paragraphId: string,
  bottomConsent: 'agree' | 'disagree'
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map((paragraph): WritingFormParagraph => {
      if (paragraph.id !== paragraphId) return paragraph
      if (!('showBottomConsent' in paragraph)) return paragraph
      return { ...paragraph, bottomConsent }
    }),
  }
}

function withPledgeClausesAgreed(draft: WritingFormDraft): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
        return paragraph
      }
      const agree = paragraph.items.find(item => item.id.includes('-agree'))
      if (agree == null) return paragraph
      return { ...paragraph, selectedPreviewSingleId: agree.id }
    }),
  }
}

describe('hasMemberConsentIncompleteRequiredFields', () => {
  it('allows portrait when instructor affiliation is prefilled from school name', () => {
    const draft = applyMemberPortraitConsentPrefill(createAgreementPortraitDraft(), {
      name: '홍길동',
      schoolEnrollmentStatus: 'enrolled',
      schoolName: '○○고등학교',
      portraitAffiliationSelectOptions: INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS,
    })

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    ).toBe(false)
  })

  it('blocks instructor portrait when affiliation is empty', () => {
    const draft = applyMemberPortraitConsentPrefill(createAgreementPortraitDraft(), {
      name: '홍길동',
      schoolEnrollmentStatus: 'not_enrolled',
      portraitAffiliationSelectOptions: INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS,
    })

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    ).toBe(true)
  })

  it('allows portrait when name and affiliation are filled', () => {
    const base = normalizeWritingFormDraft(createAgreementPortraitDraft())
    const draft = withPersonalConsentCells(base, '홍길동', 'JA Korea')

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    ).toBe(false)
  })

  it('allows portrait when affiliation is 소속 없음', () => {
    const base = normalizeWritingFormDraft(createAgreementPortraitDraft())
    const draft = withPersonalConsentCells(base, '홍길동', '소속 없음')

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    ).toBe(false)
  })

  it('blocks when a required bottom consent is disagree', () => {
    const base = withPersonalConsentCells(
      normalizeWritingFormDraft(createAgreementPortraitDraft()),
      '홍길동',
      'JA Korea'
    )
    const draft = withBottomConsent(
      base,
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
      'disagree'
    )

    expect(hasMemberConsentDisagreement(draft)).toBe(true)
    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    ).toBe(true)
  })

  it('blocks portrait placeholder name', () => {
    const base = normalizeWritingFormDraft(createAgreementPortraitDraft())
    const draft = withPersonalConsentCells(base, '한글 성명', 'JA Korea')

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    ).toBe(true)
  })

  it('blocks educator pledge when required multiple-choice is unanswered', () => {
    const draft = normalizeWritingFormDraft(createEducatorFacilitatorPledgeDraft())

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-expense' })
    ).toBe(true)
  })

  it('blocks educator pledge when a clause is disagreed', () => {
    const base = withPledgeClausesAgreed(
      normalizeWritingFormDraft(createEducatorFacilitatorPledgeDraft())
    )
    const draft: WritingFormDraft = {
      ...base,
      paragraphs: base.paragraphs.map(paragraph => {
        if (paragraph.id !== EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1) return paragraph
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
          return paragraph
        }
        const disagree = paragraph.items.find(item => item.id.includes('-disagree'))
        return { ...paragraph, selectedPreviewSingleId: disagree?.id ?? null }
      }),
    }

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-expense' })
    ).toBe(true)
  })

  it('allows educator pledge when all clauses are agreed', () => {
    const draft = withPledgeClausesAgreed(
      normalizeWritingFormDraft(createEducatorFacilitatorPledgeDraft())
    )

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-expense' })
    ).toBe(false)
  })

  it('blocks agreement-notice when subject paragraph is empty', () => {
    const draft = normalizeWritingFormDraft(createAgreementNoticeDraft())

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-notice' })
    ).toBe(true)
  })

  it('allows agreement-notice when subject and id type are filled', () => {
    const base = normalizeWritingFormDraft(createAgreementNoticeDraft())
    const draft: WritingFormDraft = {
      ...base,
      paragraphs: base.paragraphs.map(paragraph => {
        if (paragraph.id !== 'agreement-notice-subject') return paragraph
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
          return paragraph
        }
        return {
          ...paragraph,
          items: (paragraph.items ?? []).map(item => ({
            ...item,
            bodyText:
              item.id === 'agreement-notice-subj-name'
                ? '홍길동'
                : item.id === 'agreement-notice-subj-birth'
                  ? '19900101'
                  : '01012345678',
          })),
        }
      }).map(paragraph => {
        if (paragraph.id !== 'agreement-notice-table') return paragraph
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') {
          return paragraph
        }
        if (paragraph.idTypeWithInput == null) return paragraph
        return {
          ...paragraph,
          idTypeWithInput: {
            ...paragraph.idTypeWithInput,
            inputValue: '900101-1234567',
          },
        }
      }),
    }

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-notice' })
    ).toBe(false)
  })

  it('blocks agreement-notice when id type input is empty', () => {
    const base = normalizeWritingFormDraft(createAgreementNoticeDraft())
    const draft: WritingFormDraft = {
      ...base,
      paragraphs: base.paragraphs.map(paragraph => {
        if (paragraph.id !== 'agreement-notice-subject') return paragraph
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
          return paragraph
        }
        return {
          ...paragraph,
          items: (paragraph.items ?? []).map(item => ({
            ...item,
            bodyText:
              item.id === 'agreement-notice-subj-name'
                ? '홍길동'
                : item.id === 'agreement-notice-subj-birth'
                  ? '19900101'
                  : '01012345678',
          })),
        }
      }),
    }

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-notice' })
    ).toBe(true)
  })
})
