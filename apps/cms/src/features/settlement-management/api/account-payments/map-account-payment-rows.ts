import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import type { AccountPaymentListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { mapPaymentStatusToAccountPaymentStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import {
  formatLectureSessionLabel,
  type SettlementByIdMap,
} from '@/features/settlement-management/api/account-payments/map-settlement-context'

export function mapAccountPaymentListItemToRow(
  item: AccountPaymentListItemResponse,
  index: number,
  settlementById?: SettlementByIdMap
): AccountPaymentRow {
  const paymentId = item.accountPaymentId
  const settlement = item.settlementId != null ? settlementById?.get(item.settlementId) : undefined

  return {
    id: paymentId != null ? String(paymentId) : `ap-${index}`,
    accountPaymentId: paymentId,
    settlementId: item.settlementId,
    no: index + 1,
    instructorName: item.instructorName ?? settlement?.instructorName ?? '-',
    programName: settlement?.programNameKo ?? '-',
    institutionName: settlement?.institutionName?.trim() || '-',
    sessionLabel: formatLectureSessionLabel(settlement?.sessionOrdinal),
    accountPaymentStatus: mapPaymentStatusToAccountPaymentStatus(item.paymentStatus),
    amount: item.netPaymentAmount ?? 0,
    transferScheduledDate: item.scheduledPaymentDate ?? '',
    bankName: item.bankName,
    maskedAccountNo: item.maskedAccountNo,
    accountHolder: item.accountHolder,
    paymentOrderStatus: 'confirmed',
  }
}

export function mapAccountPaymentListToRows(
  items: AccountPaymentListItemResponse[],
  settlementById?: SettlementByIdMap
): AccountPaymentRow[] {
  return items.map((item, index) => mapAccountPaymentListItemToRow(item, index, settlementById))
}
