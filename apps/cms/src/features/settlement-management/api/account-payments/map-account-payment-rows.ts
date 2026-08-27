import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import type { AccountPaymentListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { mapPaymentStatusToAccountPaymentStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import { formatLectureSessionLabel } from '@/features/settlement-management/api/shared/map-frontend-fields'

function resolveSessionLabel(item: AccountPaymentListItemResponse): string {
  const label = item.sessionLabel?.trim()
  if (label) return label
  if (item.sessionOrdinal != null) return formatLectureSessionLabel(item.sessionOrdinal)
  return '-'
}

export function mapAccountPaymentListItemToRow(
  item: AccountPaymentListItemResponse,
  index: number
): AccountPaymentRow {
  const paymentId = item.accountPaymentId

  return {
    id: paymentId != null ? String(paymentId) : `ap-${index}`,
    accountPaymentId: paymentId,
    settlementId: item.settlementId,
    no: index + 1,
    instructorName: item.instructorName?.trim() || '-',
    programName: item.programNameKo?.trim() || item.programName?.trim() || '-',
    institutionName: item.institutionName?.trim() || '-',
    sessionLabel: resolveSessionLabel(item),
    accountPaymentStatus: mapPaymentStatusToAccountPaymentStatus(item.paymentStatus),
    amount: item.netPaymentAmount ?? 0,
    lectureDate: item.lectureDate ?? undefined,
    transferScheduledDate: item.scheduledPaymentDate ?? '',
    bankName: item.bankName,
    maskedAccountNo: item.maskedAccountNo,
    accountHolder: item.accountHolder,
    // 목록 API는 지급조서 CONFIRMED 건만 반환
    paymentOrderStatus: 'confirmed',
  }
}

export function mapAccountPaymentListToRows(
  items: AccountPaymentListItemResponse[]
): AccountPaymentRow[] {
  return items.map((item, index) => mapAccountPaymentListItemToRow(item, index))
}
