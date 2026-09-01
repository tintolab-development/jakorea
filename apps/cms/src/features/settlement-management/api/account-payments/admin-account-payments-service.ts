import { mapAccountPaymentDetailFromGetApi } from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import { mapAccountPaymentListToRows } from '@/features/settlement-management/api/account-payments/map-account-payment-rows'
import type { AccountPaymentsListFilterInput } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import { buildAccountPaymentsListParams } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import {
  fetchAccountPaymentDetailRemote,
  fetchAllAccountPaymentsRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow, AccountPaymentStatusDetail } from '@/data/mock/account-payments-list'

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

  const detail = await fetchAccountPaymentDetailRemote(paymentId)
  return mapAccountPaymentDetailFromGetApi(row, detail)
}
