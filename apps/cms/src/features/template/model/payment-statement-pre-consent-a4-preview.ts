import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'

export const PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
])

/** A4 본문 스코프 — 지급조서 사전 동의서 전용 미리보기 CSS */
export const PAYMENT_STATEMENT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--payment-pre-consent'

/**
 * 1페이지: 동의 표(p1~p4) + mid 확인·날짜·서명
 * 2페이지: 지급조서 + 최종 확인·날짜·서명
 */
export const PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS =
  new Set<string>([PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord])

/** 표 구간 간격 — 1페이지에 mid 확인 스택이 들어가도록 공통 40px보다 축소 */
const PAYMENT_STATEMENT_PRE_CONSENT_A4_SECTION_GAP_PX = 24

export const getPaymentStatementPreConsentA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = PAYMENT_STATEMENT_PRE_CONSENT_A4_SECTION_GAP_PX
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
