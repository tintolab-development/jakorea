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
import { normalizeMemberConsentWriteDraft } from '@/features/user/shared/lib/normalize-member-consent-write-draft'
import {
  collectMemberConsentDisagreedRequiredLabels,
  getMemberConsentInvalidNoticeSubjectContactAlertMessage,
  hasMemberConsentIncompleteRequiredFields,
  hasMemberConsentInvalidIdTypeResidentNumber,
  hasMemberConsentInvalidPaymentStatementResidentNumber,
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
  it('blocks portrait on write entry when name and affiliation are empty', () => {
    const draft = normalizeMemberConsentWriteDraft(
      createAgreementPortraitDraft(),
      'agreement-portrait'
    )

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    ).toBe(true)
  })

  it('blocks portrait when affiliation is empty but name is filled', () => {
    const draft = withPersonalConsentCells(
      normalizeMemberConsentWriteDraft(createAgreementPortraitDraft(), 'agreement-portrait'),
      '홍길동',
      ''
    )

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

    expect(collectMemberConsentDisagreedRequiredLabels(draft).length).toBeGreaterThan(0)
    expect(collectMemberConsentDisagreedRequiredLabels(draft)).toEqual([
      '개인정보 및 초상권 수집·이용 동의',
    ])
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

  it('blocks educator pledge on write entry when required multiple-choice is unanswered', () => {
    const draft = normalizeMemberConsentWriteDraft(
      createEducatorFacilitatorPledgeDraft(),
      'agreement-expense'
    )

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

    expect(collectMemberConsentDisagreedRequiredLabels(draft)).toEqual([
      '아동·청소년 보호와 성범죄 예방',
    ])
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

  it('blocks agreement-notice on write entry when subject paragraph is empty', () => {
    const draft = normalizeMemberConsentWriteDraft(
      normalizeWritingFormDraft(createAgreementNoticeDraft()),
      'agreement-notice'
    )

    expect(
      hasMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-notice' })
    ).toBe(true)
  })

  it('allows agreement-notice when subject paragraph is filled', () => {
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
    ).toBe(false)
  })
})

describe('hasMemberConsentInvalidPaymentStatementResidentNumber', () => {
  it('is false for non-payment-statement templates', () => {
    expect(
      hasMemberConsentInvalidPaymentStatementResidentNumber({
        templateId: 'agreement-portrait',
        paymentStatementBasicInfo: { residentFront: '123', residentBack: '1234567' },
      })
    ).toBe(false)
  })

  it('is true when payment-statement resident number format is invalid', () => {
    expect(
      hasMemberConsentInvalidPaymentStatementResidentNumber({
        templateId: 'agreement-third-party',
        paymentStatementBasicInfo: { residentFront: '991332', residentBack: '1234567' },
      })
    ).toBe(true)
  })
})

function withNoticeResidentInput(draft: WritingFormDraft, inputValue: string): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== 'agreement-notice-table') return paragraph
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') {
        return paragraph
      }
      if (paragraph.idTypeWithInput == null) return paragraph
      return {
        ...paragraph,
        idTypeWithInput: {
          ...paragraph.idTypeWithInput,
          inputValue,
        },
      }
    }),
  }
}

describe('hasMemberConsentInvalidIdTypeResidentNumber', () => {
  it('is false when the notice resident number is empty', () => {
    const draft = normalizeWritingFormDraft(createAgreementNoticeDraft())
    expect(hasMemberConsentInvalidIdTypeResidentNumber(draft)).toBe(false)
  })

  it('is false when YYMMDD + 7 digits are valid', () => {
    const draft = withNoticeResidentInput(
      normalizeWritingFormDraft(createAgreementNoticeDraft()),
      '970721-1234567'
    )
    expect(hasMemberConsentInvalidIdTypeResidentNumber(draft)).toBe(false)
  })

  it('is true when both parts are filled but the date is invalid', () => {
    const draft = withNoticeResidentInput(
      normalizeWritingFormDraft(createAgreementNoticeDraft()),
      '991332-1234567'
    )
    expect(hasMemberConsentInvalidIdTypeResidentNumber(draft)).toBe(true)
  })

  it('is true when the entered value is incomplete', () => {
    const draft = withNoticeResidentInput(
      normalizeWritingFormDraft(createAgreementNoticeDraft()),
      '970721-123456'
    )
    expect(hasMemberConsentInvalidIdTypeResidentNumber(draft)).toBe(true)
  })
})

function withNoticeSubjectContact(
  draft: WritingFormDraft,
  birth: string,
  phone: string
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== 'agreement-notice-subject') return paragraph
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
        return paragraph
      }
      return {
        ...paragraph,
        items: (paragraph.items ?? []).map(item => ({
          ...item,
          bodyText:
            item.id === 'agreement-notice-subj-birth'
              ? birth
              : item.id === 'agreement-notice-subj-phone'
                ? phone
                : item.bodyText,
        })),
      }
    }),
  }
}

describe('getMemberConsentInvalidNoticeSubjectContactAlertMessage', () => {
  it('is null when birth and phone are empty or valid', () => {
    const empty = normalizeWritingFormDraft(createAgreementNoticeDraft())
    expect(getMemberConsentInvalidNoticeSubjectContactAlertMessage(empty)).toBeNull()

    const valid = withNoticeSubjectContact(empty, '1991.01.01', '010-1234-5678')
    expect(getMemberConsentInvalidNoticeSubjectContactAlertMessage(valid)).toBeNull()
    expect(
      getMemberConsentInvalidNoticeSubjectContactAlertMessage(
        withNoticeSubjectContact(empty, '19910101', '01012345678')
      )
    ).toBeNull()
  })

  it('returns birth alert when the date is invalid', () => {
    const draft = withNoticeSubjectContact(
      normalizeWritingFormDraft(createAgreementNoticeDraft()),
      '1991.13.01',
      '010-1234-5678'
    )
    expect(getMemberConsentInvalidNoticeSubjectContactAlertMessage(draft)).toBe(
      '올바른 생년월일을 입력해 주세요.'
    )
  })

  it('returns phone alert when the number is invalid', () => {
    const draft = withNoticeSubjectContact(
      normalizeWritingFormDraft(createAgreementNoticeDraft()),
      '1991.01.01',
      '010-123'
    )
    expect(getMemberConsentInvalidNoticeSubjectContactAlertMessage(draft)).toBe(
      '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    )
  })
})
