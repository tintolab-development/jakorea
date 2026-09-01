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

/**
 * CMS 가로형 테이블에서 강조(20/700)로 노출하는 본문 셀.
 * Platform runtime도 동일 열에 `cell-text--emphasized`를 붙인다.
 * p1은 스펙 스크린샷과 같이 보유기간만 강조한다.
 */
export function isHorizontalTableEmphasizedBodyCell(
  paragraphId: string,
  colIndex: number
): boolean {
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection) {
    return colIndex === 2
  }
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection) {
    return colIndex === 0 || colIndex === 2
  }
  if (
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty ||
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty
  ) {
    return colIndex !== 1
  }
  return false
}
