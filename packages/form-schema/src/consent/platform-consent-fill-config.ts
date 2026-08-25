import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '../writing-form/draft-schema.js'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '../paragraph-ids/payment-statement-pre-consent-draft.js'

/** Platform 사용자 fill — system 날짜 단락 숨김 (전자서명 sidecar로 대체) */
export const PAYMENT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
])

export const EDUCATOR_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate,
])

export const NOTICE_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
])

export function resolvePlatformConsentHiddenParagraphIds(templateId: string): Set<string> {
  if (templateId === 'agreement-third-party') {
    return PAYMENT_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
  }
  if (templateId === 'agreement-expense') {
    return EDUCATOR_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
  }
  if (templateId === 'agreement-notice') {
    return NOTICE_CONSENT_PLATFORM_HIDDEN_PARAGRAPH_IDS
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
