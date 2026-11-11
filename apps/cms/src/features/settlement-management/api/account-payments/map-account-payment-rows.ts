import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import type { AccountPaymentListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { mapPaymentStatusToAccountPaymentStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'

function resolveSessionLabel(item: AccountPaymentListItemResponse): string {
  const label = item.sessionLabel?.trim()
  if (label) return label
  return '-'
}

export function mapAccountPaymentListItemToRow(
  item: AccountPaymentListItemResponse,
  index: number
): AccountPaymentRow {
  const paymentId = item.accountPaymentId

  return {
    id: paymentId != null ? String(paymentId) : `ap-${index}`,
    accountPaymentId: paymentId ?? undefined,
    settlementId: item.settlementId ?? undefined,
    no: index + 1,
    instructorName: item.instructorName?.trim() || '-',
    programId: item.programId ?? undefined,
    programName: item.programNameKo?.trim() || item.programName?.trim() || '-',
    institutionName: item.institutionName?.trim() || '-',
    sessionLabel: resolveSessionLabel(item),
    accountPaymentStatus: mapPaymentStatusToAccountPaymentStatus(item.paymentStatus),
    amount: item.netPaymentAmount ?? 0,
    lectureDate: item.lectureDate ?? undefined,
    transferScheduledDate: item.scheduledPaymentDate ?? '',
    paidAt: item.paidAt ?? undefined,
    bankName: item.bankName ?? undefined,
    maskedAccountNo: item.maskedAccountNo ?? undefined,
    accountHolder: item.accountHolder ?? undefined,
    /** 계좌 지급 memberId — 지급조서 instructorMemberId와 다를 수 있음(시안 카탈로그 분리). 이름 merge 금지 */
    instructorMemberId: item.memberId ?? undefined,
    // 목록 API는 지급조서 CONFIRMED 건만 반환
    paymentOrderStatus: 'confirmed',
    ...(item.payeeType ? { payeeType: item.payeeType } : {}),
    ...(item.sourceType?.trim() ? { sourceType: item.sourceType.trim() } : {}),
  }
}

export function mapAccountPaymentListToRows(
  items: AccountPaymentListItemResponse[]
): AccountPaymentRow[] {
  return items.map((item, index) => mapAccountPaymentListItemToRow(item, index))
}
