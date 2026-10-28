import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

export type AccountPaymentFormIssueKind = 'bulk-transfer' | 'tax-report'

/** 대량이체: 지급 대기 + 원장 ID. 세금신고: 지급 완료 + settlementId. */
export function isAccountPaymentFormIssueEligible(
  kind: AccountPaymentFormIssueKind,
  row: AccountPaymentRow
): boolean {
  if (kind === 'bulk-transfer') {
    return (
      row.accountPaymentStatus === 'awaiting_confirmation' &&
      (row.settlementId != null || row.accountPaymentId != null)
    )
  }
  return row.accountPaymentStatus === 'account_paid' && row.settlementId != null
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
