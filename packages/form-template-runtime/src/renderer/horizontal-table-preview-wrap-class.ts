import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'

/** 지급조서 사전 동의서 — 단락별 가로형 테이블 타이포 래퍼 */
export function resolvePaymentPreConsentHorizontalTableWrapClass(
  paragraphId: string
): string {
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection) {
    return 'form-template-horizontal-table-wrap--payment-pre-consent-p1'
  }
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection) {
    return 'form-template-horizontal-table-wrap--payment-pre-consent-p2'
  }
  if (
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty ||
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty
  ) {
    return 'form-template-horizontal-table-wrap--payment-pre-consent-third-party'
  }
  return ''
}
