import { mapAccountPaymentDetailFromGetApi } from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import { mapAccountPaymentListToRows } from '@/features/settlement-management/api/account-payments/map-account-payment-rows'
import {
  fetchAccountPaymentDetailRemote,
  fetchAllAccountPaymentsRemote,
  fetchSettlementDetailRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow, AccountPaymentStatusDetail } from '@/data/mock/account-payments-list'

export async function getAccountPaymentsListRemote(): Promise<AccountPaymentRow[]> {
  const payments = await fetchAllAccountPaymentsRemote()
  return mapAccountPaymentListToRows(payments ?? [])
}

export async function getAccountPaymentDetailRemote(
  row: AccountPaymentRow
): Promise<AccountPaymentStatusDetail> {
  const paymentId = row.accountPaymentId
  if (paymentId == null) {
    throw new Error('계좌 지급 상세에 필요한 accountPaymentId가 없습니다.')
  }

  const [detail, settlementFrontend] = await Promise.all([
    fetchAccountPaymentDetailRemote(paymentId),
    row.settlementId != null
      ? fetchSettlementDetailRemote(row.settlementId)
      : Promise.resolve(undefined),
  ])
  return mapAccountPaymentDetailFromGetApi(row, detail, settlementFrontend)
}
