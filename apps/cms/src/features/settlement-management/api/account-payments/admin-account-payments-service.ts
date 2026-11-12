import { mapAccountPaymentDetailFromGetApi } from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import { mapAccountPaymentListToRows } from '@/features/settlement-management/api/account-payments/map-account-payment-rows'
import type { AccountPaymentsListFilterInput } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import { buildAccountPaymentsListParams } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import {
  ACCOUNT_PAYMENT_DETAIL_AUDIT_REASON,
  fetchAccountPaymentDetailRemote,
  fetchAllAccountPaymentsRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow, AccountPaymentStatusDetail } from '@/features/settlement-management/model/account-payments-list'

/**
 * 계좌 지급 상세는 GET /api/admin/account-payments/{id}?reason=… 로 조회한다.
 * 상세는 원문 화면이다(기획 2026-11-12 Q3): sensitiveAccount 계좌 원문과 settlement.payee(RAW)를 그대로 표시한다.
 */

export async function getAccountPaymentsListRemote(
  filters: AccountPaymentsListFilterInput = {}
): Promise<AccountPaymentRow[]> {
  const payments = await fetchAllAccountPaymentsRemote(buildAccountPaymentsListParams(filters))
  return mapAccountPaymentListToRows(payments ?? [])
}

export async function getAccountPaymentDetailRemote(
  row: AccountPaymentRow
): Promise<AccountPaymentStatusDetail> {
  const paymentId = row.accountPaymentId
  if (paymentId == null) {
    throw new Error('계좌 지급 상세에 필요한 accountPaymentId가 없습니다.')
  }

  const detail = await fetchAccountPaymentDetailRemote(
    paymentId,
    ACCOUNT_PAYMENT_DETAIL_AUDIT_REASON
  )
  return mapAccountPaymentDetailFromGetApi(row, detail)
}
