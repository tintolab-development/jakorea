import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

export type AccountPaymentFormIssueKind = 'bulk-transfer' | 'tax-report'

/**
 * 대량이체: 지급 대기(지급조서 확인 완료) 또는 계좌 지급 완료 + 원장 ID. 지급 실패(`paymentFailureYn`) 건은 서버가 거절하므로 제외한다.
 * 세금신고: 계좌 지급 완료 + 원장 ID — 정산서 없는 직접 계좌 지급(Gemini 교육 보고)도 서버 TAX_REPORT 대상이다.
 */
export function isAccountPaymentFormIssueEligible(
  kind: AccountPaymentFormIssueKind,
  row: AccountPaymentRow
): boolean {
  if (kind === 'bulk-transfer') {
    return (
      (row.accountPaymentStatus === 'awaiting_confirmation' ||
        row.accountPaymentStatus === 'account_paid') &&
      row.paymentFailureYn !== true &&
      (row.settlementId != null || row.accountPaymentId != null)
    )
  }
  return (
    row.accountPaymentStatus === 'account_paid' &&
    (row.settlementId != null || row.accountPaymentId != null)
  )
}

export function pickEligibleAccountPaymentFormIssueRows(
  kind: AccountPaymentFormIssueKind,
  rows: readonly AccountPaymentRow[]
): AccountPaymentRow[] | null {
  if (rows.some(row => !isAccountPaymentFormIssueEligible(kind, row))) {
    return null
  }
  return [...rows]
}
