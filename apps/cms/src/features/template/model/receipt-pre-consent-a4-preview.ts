import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import { RECEIPT_PRE_CONSENT_IDS } from '@/features/template/model/receipt-pre-consent-draft'

export const RECEIPT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  RECEIPT_PRE_CONSENT_IDS.title,
])

/** 지급조서 사전 동의서와 동일 A4 시트 규격 — 주민번호 행은 폼 옵션으로 숨긴다 */
export const RECEIPT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--payment-pre-consent'

export const RECEIPT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS = new Set<string>([
  RECEIPT_PRE_CONSENT_IDS.paymentRecord,
])

const RECEIPT_PRE_CONSENT_A4_SECTION_GAP_PX = 24

export const getReceiptPreConsentA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = RECEIPT_PRE_CONSENT_A4_SECTION_GAP_PX
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
