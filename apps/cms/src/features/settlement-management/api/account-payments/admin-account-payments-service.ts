import { mapAccountPaymentDetailRemote } from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import { mapAccountPaymentListToRows } from '@/features/settlement-management/api/account-payments/map-account-payment-rows'
import { buildSettlementByIdMap } from '@/features/settlement-management/api/account-payments/map-settlement-context'
import {
  fetchAllAccountPaymentsRemote,
  fetchAllSettlementsRemote,
  fetchSettlementDetailRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow, AccountPaymentStatusDetail } from '@/data/mock/account-payments-list'

export async function getAccountPaymentsListRemote(): Promise<AccountPaymentRow[]> {
  const [payments, settlements] = await Promise.all([
    fetchAllAccountPaymentsRemote(),
    fetchAllSettlementsRemote(),
  ])
  const settlementById = buildSettlementByIdMap(settlements ?? [])
  return mapAccountPaymentListToRows(payments ?? [], settlementById)
}

export async function getAccountPaymentDetailRemote(
  row: AccountPaymentRow
): Promise<AccountPaymentStatusDetail> {
  const settlementId = row.settlementId
  if (settlementId == null) {
    throw new Error('계좌 지급 상세에 필요한 settlementId가 없습니다.')
  }

  const [settlement, settlements] = await Promise.all([
    fetchSettlementDetailRemote(settlementId),
    fetchAllSettlementsRemote(),
  ])
  const settlementListItem = (settlements ?? []).find(s => s.settlementId === settlementId)
  return mapAccountPaymentDetailRemote(row, settlement, settlementListItem)
}
