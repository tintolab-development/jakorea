import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'

export const PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
])

/**
 * 동의 표(p1~p4) | 활동경험·mid 확인·지급조서·최종 확인 으로 나눈다.
 * `jaKoreaActivity`와 `midConsentLine`에 **동시** 강제 분절하면 활동경험만 남은 빈 2페이지가 생긴다.
 * 분절은 활동경험 직전 한 곳만 둔다.
 */
export const PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS =
  new Set<string>([PAYMENT_STATEMENT_PRE_CONSENT_IDS.jaKoreaActivity])

export const getPaymentStatementPreConsentA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
