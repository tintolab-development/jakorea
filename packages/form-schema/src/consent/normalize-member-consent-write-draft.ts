import {
  clearWritingFormParagraphBottomConsent,
  clearWritingFormParagraphFillPreviewAnswers,
} from '../writing-form/clear-writing-form-fill-preview-answers.js'
import {
  AGREEMENT_NOTICE_DEFAULT_PURPOSE,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'
import { overlayPaymentStatementPreConsentSeedHorizontalTables } from '../paragraph-ids/payment-statement-pre-consent-draft.js'

function clearNoticeInteractiveParagraph(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) return paragraph
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') return paragraph

  return {
    ...paragraph,
    bodyText: '',
    items: (paragraph.items ?? []).map(item => ({ ...item, bodyText: '' })),
  }
}

function resetNoticeInstitutionAndPurpose(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'agreement_explanation_text') {
    return paragraph
  }
  if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.institution) {
    return { ...paragraph, bodyText: '' }
  }
  if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.purpose) {
    return { ...paragraph, bodyText: AGREEMENT_NOTICE_DEFAULT_PURPOSE }
  }
  return paragraph
}

function clearNoticeIdTypeWithInput(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (
    paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.table ||
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'horizontal_table'
  ) {
    return paragraph
  }

  const nested = paragraph.idTypeWithInput
  if (nested == null) return paragraph

  return {
    ...paragraph,
    idTypeWithInput: {
      ...nested,
      selectedOptionId: null,
      inputPlaceholder: nested.inputPlaceholder?.trim() || '번호를 입력해 주세요',
      inputValue: '',
    },
  }
}

function normalizeParagraphForWrite(
  paragraph: WritingFormParagraph,
  templateId: string
): WritingFormParagraph {
  let next = clearWritingFormParagraphFillPreviewAnswers(paragraph)

  if (templateId === 'agreement-notice') {
    next = clearNoticeInteractiveParagraph(next)
    next = clearNoticeIdTypeWithInput(next)
    next = resetNoticeInstitutionAndPurpose(next)
  }

  return next
}

/** 동의서 작성 진입 — seed/API 구조는 유지하고 응답 필드만 비움 */
export function normalizeMemberConsentWriteDraft(
  draft: WritingFormDraft,
  templateId: string
): WritingFormDraft {
  let next: WritingFormDraft = {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph =>
      normalizeParagraphForWrite(paragraph, templateId)
    ),
  }

  if (
    templateId === 'agreement-third-party' ||
    templateId === 'document-payment-order-pre-consent'
  ) {
    // 가로형 표(p1~p4)를 최신 시드로 덮으면 bottomConsent:'agree'가 다시 들어옴 → 응답 필드 재비움
    next = overlayPaymentStatementPreConsentSeedHorizontalTables(next)
    next = {
      ...next,
      paragraphs: next.paragraphs.map(clearWritingFormParagraphBottomConsent),
    }
  }

  return next
}
