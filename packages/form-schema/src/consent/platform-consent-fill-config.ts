import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '../writing-form/draft-schema.js'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '../paragraph-ids/payment-statement-pre-consent-draft.js'
import { RECEIPT_PRE_CONSENT_IDS } from '../paragraph-ids/receipt-pre-consent-draft.js'

/** Platform 사용자 fill — system 날짜 단락 숨김 (전자서명 sidecar로 대체) */
export const PAYMENT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
])

export const RECEIPT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  RECEIPT_PRE_CONSENT_IDS.midDate,
  RECEIPT_PRE_CONSENT_IDS.tailDate,
  /** midConsentLine / finalConfirm + ConsentSignatureStatement */
  RECEIPT_PRE_CONSENT_IDS.midSignature,
  RECEIPT_PRE_CONSENT_IDS.tailSignature,
])

export const EDUCATOR_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate,
  /** violationClosing + ConsentSignatureStatement — CMS admin-proxy 확인 카드와 동일 */
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature,
])

/** 행정정보 — 날짜는 `PFFormSignatureBlock` sidecar. 서명란은 초상권과 같이 `systemSignature` 슬롯(JA KOREA 귀하) 노출 */
export const NOTICE_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
  /** 시드 `body: ''` — 작성 화면 문구 없음(A4 구분용). Platform copy fallback 금지 */
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
])

export const PORTRAIT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
])

export function resolvePlatformConsentHiddenParagraphIds(templateId: string): Set<string> {
  if (templateId === 'agreement-third-party') {
    return PAYMENT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
  }
  if (templateId === 'agreement-receipt-pre-consent') {
    return RECEIPT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
  }
  if (templateId === 'agreement-expense') {
    return EDUCATOR_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
  }
  if (templateId === 'agreement-notice') {
    return NOTICE_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
  }
  if (templateId === 'agreement-portrait') {
    return PORTRAIT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
  }
  return new Set<string>()
}

/** Platform fill — 입력 가능한 agreement_explanation_text 단락 (행정정보) */
export const NOTICE_FILL_INTERACTIVE_EXPLANATION_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.institution,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.purpose,
])

export type PlatformConsentFillOptions = {
  consentFillReadOnlyBody?: boolean
  interactiveExplanationIds?: ReadonlySet<string>
}

export function buildPlatformConsentFillOptions(templateId: string): PlatformConsentFillOptions {
  return {
    consentFillReadOnlyBody: true,
    interactiveExplanationIds:
      templateId === 'agreement-notice' ? NOTICE_FILL_INTERACTIVE_EXPLANATION_IDS : undefined,
  }
}
