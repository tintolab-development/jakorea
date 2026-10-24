import { describe, expect, it } from 'vitest'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME,
  AGREEMENT_NOTICE_A4_SECTION_GAP_PX,
  getAgreementNoticeA4ParagraphGap,
} from '@/features/template/model/agreement-notice-a4-preview'

describe('agreement-notice A4 preview', () => {
  it('scopes document preview CSS to the agreement-notice body class', () => {
    expect(AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME).toBe(
      'form-document-preview-body--agreement-notice'
    )
  })

  it('uses compact section gap for 1-page layout', () => {
    expect(AGREEMENT_NOTICE_A4_SECTION_GAP_PX).toBeLessThan(40)
  })

  it('zeros gap around confirmationClosing stack divider', () => {
    const draft = createAgreementNoticeDraft()
    const paragraphs = draft.paragraphs.filter(
      p => p.id !== 'agreement-notice-title'
    )
    const closingIdx = paragraphs.findIndex(
      p => p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing
    )
    expect(closingIdx).toBeGreaterThan(0)
    const dateParagraph = paragraphs[closingIdx + 1]
    expect(dateParagraph?.id).toBe(AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate)
    expect(
      getAgreementNoticeA4ParagraphGap(
        paragraphs[closingIdx],
        closingIdx,
        paragraphs.slice(0, closingIdx)
      )
    ).toBe(0)
    expect(
      getAgreementNoticeA4ParagraphGap(dateParagraph!, closingIdx + 1, paragraphs.slice(0, closingIdx + 1))
    ).toBe(0)
  })
})
