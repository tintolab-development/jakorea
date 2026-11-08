import {
  clearWritingFormParagraphBottomConsent,
  clearWritingFormParagraphFillPreviewAnswers,
} from '../writing-form/clear-writing-form-fill-preview-answers.js'
import {
  AGREEMENT_NOTICE_DEFAULT_PURPOSE,
  AGREEMENT_NOTICE_INSTITUTION_PARAGRAPH,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  ensureAgreementNoticeConfirmationClosing,
  fillAgreementNoticeWriteDefaults,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'
import { overlayPaymentStatementPreConsentSeedHorizontalTables } from '../paragraph-ids/payment-statement-pre-consent-draft.js'
import { overlayReceiptPreConsentSeedHorizontalTables } from '../paragraph-ids/receipt-pre-consent-draft.js'

function clearNoticeInteractiveParagraph(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) return paragraph
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') return paragraph

  return {
    ...paragraph,
    bodyText: '',
    items: (paragraph.items ?? []).map(item => ({ ...item, bodyText: '' })),
  }
}

/**
 * 이용기관·이용사무 — 표시 전용 본문. **서버(CMS) 저장값 우선**, 비었을 때만 시드 문구.
 * (구 동작: 이용기관을 `''`로, 이용사무를 기본값으로 강제 덮어씀 → 제거)
 */
function fillEmptyNoticeInstitutionAndPurpose(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'agreement_explanation_text') {
    return paragraph
  }
  if ((paragraph.bodyText ?? '').trim() !== '') return paragraph
  if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.institution) {
    return { ...paragraph, bodyText: AGREEMENT_NOTICE_INSTITUTION_PARAGRAPH.bodyText }
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
    next = fillEmptyNoticeInstitutionAndPurpose(next)
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

  if (templateId === 'agreement-notice') {
    // 확인문 빈 값 채움 + 5번 하단 안내 누락 시 삽입(저장값은 유지)
    next = fillAgreementNoticeWriteDefaults(ensureAgreementNoticeConfirmationClosing(next))
  }

  if (
    templateId === 'agreement-third-party' ||
    templateId === 'document-payment-order-pre-consent'
  ) {
    // 가로형 표(p1~p4)는 저장값 우선(깨진 표만 시드 복구) — 복구된 시드의 bottomConsent:'agree' 재비움
    next = overlayPaymentStatementPreConsentSeedHorizontalTables(next)
    next = {
      ...next,
      paragraphs: next.paragraphs.map(clearWritingFormParagraphBottomConsent),
    }
  }

  if (templateId === 'agreement-receipt-pre-consent') {
    next = overlayReceiptPreConsentSeedHorizontalTables(next)
    next = {
      ...next,
      paragraphs: next.paragraphs.map(clearWritingFormParagraphBottomConsent),
    }
  }

  return next
}
