import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import type {
  InstructorSettlementInvoiceDetail,
  InstructorSettlementListRow,
  InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import {
  mapPaymentStatusToAccountPaymentStatus,
  mapStatementStatusToProcessingStatus,
} from '@/features/settlement-management/api/shared/settlement-status-mappers'

function paymentOrderStatusToInstructorUiStatus(
  s: ReturnType<typeof mapStatementStatusToProcessingStatus>
): InstructorSettlementUiStatus {
  switch (s) {
    case 'pending':
      return 'awaiting_confirmation'
    case 'confirmed':
      return 'payment_statement_verified'
    case 'correction':
      return 'payment_correction_requested'
    case 'application_rejected':
      return 'application_rejected'
    default:
      return 'none'
  }
}

function resolveSettlementUiStatus(item: SettlementListItemResponse): InstructorSettlementUiStatus {
  const paymentStatus = item.paymentStatus?.toUpperCase()
  if (paymentStatus === 'PAID') {
    return 'account_paid'
  }
  if (paymentStatus === 'CORRECTION_REQUESTED') {
    return 'payment_correction_requested'
  }
  if (paymentStatus === 'CONFIRMED') {
    return mapPaymentStatusToAccountPaymentStatus(item.paymentStatus) === 'partial_confirmation'
      ? 'partial_confirmation'
      : 'payment_statement_verified'
  }
  return paymentOrderStatusToInstructorUiStatus(
    mapStatementStatusToProcessingStatus(item.statementStatus)
  )
}

function placeholderInvoice(
  item: SettlementListItemResponse,
  status: InstructorSettlementUiStatus
): InstructorSettlementInvoiceDetail {
  const programName = item.programNameKo?.trim() || '프로그램'
  const lectureDate = item.lectureDate?.slice(0, 10) ?? '-'
  const net = item.netPaymentAmount ?? 0
  return {
    programName,
    sessionProgress: '-',
    operationPeriod: lectureDate,
    paymentStatementStatus: status,
    expectedTransferDate: item.expectedTransferDate?.slice(0, 10) ?? '-',
    lectureFeeBasis: item.taxIncomeType?.trim() || '-',
    businessIncomeEarner: '-',
    institutionName: '-',
    lectureDateSessions: lectureDate,
    lineItems: [
      {
        key: 'net',
        산정항목: '정산 금액',
        항목설명: programName,
        정산금액: net,
        isPositive: net >= 0,
      },
    ],
    withholdingRatePercent: 0,
    withholdingAmount: item.withholdingTaxAmount ?? 0,
    totalFormulaLabel: '정산 예정',
    totalAmount: net,
  }
}

export function mapSettlementItemToInstructorMemberRow(
  item: SettlementListItemResponse,
  index: number
): InstructorSettlementListRow | null {
  const settlementId = item.settlementId
  if (settlementId == null) return null

  const status = resolveSettlementUiStatus(item)
  const programName = item.programNameKo?.trim() || `프로그램 ${item.programId ?? ''}`
  const calendarDate = item.lectureDate?.slice(0, 10) ?? item.expectedTransferDate?.slice(0, 10) ?? ''

  return {
    id: String(settlementId),
    no: index + 1,
    programName,
    instructorName: item.instructorName?.trim(),
    institutionName: '-',
    lectureDateDisplay: calendarDate || '-',
    calendarDate: calendarDate || new Date().toISOString().slice(0, 10),
    status,
    scheduledAmount: item.netPaymentAmount ?? item.grossAmount ?? 0,
    detailAvailable: true,
    invoice: placeholderInvoice(item, status),
  }
}

export function mapSettlementsToInstructorMemberRows(
  items: SettlementListItemResponse[]
): InstructorSettlementListRow[] {
  return items
    .map((item, index) => mapSettlementItemToInstructorMemberRow(item, index))
    .filter((row): row is InstructorSettlementListRow => row != null)
}
