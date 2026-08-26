import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import type { AccountPaymentListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { mapPaymentStatusToAccountPaymentStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import {
  formatLectureSessionLabel,
  type SettlementByIdMap,
} from '@/features/settlement-management/api/account-payments/map-settlement-context'

/** OpenAPI 목록 DTO에 아직 없는 필드 — 백엔드가 내려주면 정산 목록 join 없이 사용 */
type AccountPaymentListItemExtras = AccountPaymentListItemResponse & {
  programNameKo?: string
  programName?: string
  institutionName?: string
  sessionOrdinal?: number
  lectureDate?: string
}

export function mapAccountPaymentListItemToRow(
  item: AccountPaymentListItemResponse,
  index: number,
  settlementById?: SettlementByIdMap
): AccountPaymentRow {
  const paymentId = item.accountPaymentId
  const extra = item as AccountPaymentListItemExtras
  const settlement = item.settlementId != null ? settlementById?.get(item.settlementId) : undefined

  return {
    id: paymentId != null ? String(paymentId) : `ap-${index}`,
    accountPaymentId: paymentId,
    settlementId: item.settlementId,
    no: index + 1,
    instructorName: item.instructorName ?? settlement?.instructorName ?? '-',
    programName: extra.programNameKo ?? extra.programName ?? settlement?.programNameKo ?? '-',
    institutionName: extra.institutionName?.trim() || settlement?.institutionName?.trim() || '-',
    sessionLabel: formatLectureSessionLabel(extra.sessionOrdinal ?? settlement?.sessionOrdinal),
    accountPaymentStatus: mapPaymentStatusToAccountPaymentStatus(item.paymentStatus),
    amount: item.netPaymentAmount ?? 0,
    lectureDate: extra.lectureDate ?? settlement?.lectureDate,
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
