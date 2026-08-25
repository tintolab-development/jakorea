import type { SettlementFrontendItemResponse, SettlementFrontendResponse } from '@/shared/api/generated/settlement/schemas'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import type {
  InstructorSettlementInvoiceDetail,
  InstructorSettlementInvoiceLineItem,
  InstructorSettlementUiStatus,
} from '@/features/user/detail/model/instructor-settlement-types'
import {
  mapPaymentStatusToAccountPaymentStatus,
  mapStatementStatusToProcessingStatus,
} from '@/features/settlement-management/api/shared/settlement-status-mappers'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'
import { mapSettlementFrontendItemTypeToLineKind } from '@/features/settlement/lib/resolve-settlement-item-setting-for-calculation-row'

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

export function resolveSettlementUiStatus(item: SettlementListItemResponse): InstructorSettlementUiStatus {
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

function mapItemToLine(item: SettlementFrontendItemResponse, index: number): InstructorSettlementInvoiceLineItem {
  const amount = item.amount ?? 0
  const kind = mapSettlementFrontendItemTypeToLineKind(item.type, amount)
  return {
    key: `item-${index}`,
    산정항목: formatPaymentOrderCalculationItemLabel(item.type, amount),
    항목설명: item.description?.trim() || '—',
    정산금액: Math.abs(amount),
    isPositive: kind !== 'withholding' && amount >= 0,
  }
}

function formatIsoDate(iso?: string): string {
  if (!iso?.trim()) return '-'
  const parsed = dayjs(iso.slice(0, 10))
  return parsed.isValid() ? parsed.format('YYYY. MM. DD') : iso
}

export function mapSettlementDetailToInstructorInvoice(
  settlement: SettlementFrontendResponse,
  listItem: SettlementListItemResponse,
  status: InstructorSettlementUiStatus
): InstructorSettlementInvoiceDetail {
  const programName = listItem.programNameKo?.trim() || '프로그램'
  const items = settlement.items ?? []
  const lineItems =
    items.length > 0
      ? items.map(mapItemToLine)
      : [
          {
            key: 'net',
            산정항목: '정산 금액',
            항목설명: programName,
            정산금액: listItem.netPaymentAmount ?? listItem.grossAmount ?? 0,
            isPositive: true,
          },
        ]

  const withholdingLine = lineItems.find(line => line.산정항목.includes('원천'))
  const withholdingAmount =
    listItem.withholdingTaxAmount ??
    (withholdingLine ? Math.abs(withholdingLine.정산금액) : 0)
  const totalAmount = settlement.totalAmount ?? listItem.netPaymentAmount ?? 0
  const lectureDate = formatIsoDate(listItem.lectureDate)

  return {
    programName,
    sessionProgress: '-',
    operationPeriod: settlement.period?.trim() || lectureDate,
    paymentStatementStatus: status,
    expectedTransferDate: formatIsoDate(listItem.expectedTransferDate),
    lectureFeeBasis: listItem.taxIncomeType?.trim() || '-',
    businessIncomeEarner: '해당 없음',
    institutionName: listItem.programNameKo?.trim() ? '-' : '-',
    lectureDateSessions: lectureDate,
    lineItems: lineItems.filter(line => !line.산정항목.includes('원천')),
    withholdingRatePercent: withholdingAmount > 0 ? 8.8 : 0,
    withholdingAmount,
    totalFormulaLabel: '정산 항목 합계',
    totalAmount,
  }
}

export function mapSettlementItemToInstructorMemberRow(
  item: SettlementListItemResponse,
  index: number,
  statementId?: number
): InstructorSettlementListRow | null {
  const settlementId = item.settlementId
  if (settlementId == null) return null

  const status = resolveSettlementUiStatus(item)
  const programName = item.programNameKo?.trim() || `프로그램 ${item.programId ?? ''}`
  const calendarDate = item.lectureDate?.slice(0, 10) ?? item.expectedTransferDate?.slice(0, 10) ?? ''

  return {
    id: String(settlementId),
    settlementId,
    statementId,
    correctionRequestId: item.settlementCorrectionRequestId,
    no: index + 1,
    programName,
    instructorName: item.instructorName?.trim(),
    institutionName: '-',
    lectureDateDisplay: calendarDate || '-',
    calendarDate: calendarDate || new Date().toISOString().slice(0, 10),
    status,
    scheduledAmount: item.netPaymentAmount ?? item.grossAmount ?? 0,
    detailAvailable: status !== 'none',
    invoice: mapSettlementDetailToInstructorInvoice({ items: [], totalAmount: item.netPaymentAmount }, item, status),
  }
}

export async function enrichInstructorSettlementRowsWithStatementIds(
  rows: InstructorSettlementListRow[],
  resolveStatementId: (settlementId: number) => Promise<number | undefined>
): Promise<InstructorSettlementListRow[]> {
  return Promise.all(
    rows.map(async row => {
      if (row.statementId != null) return row
      const statementId = await resolveStatementId(row.settlementId)
      return statementId != null ? { ...row, statementId } : row
    })
  )
}

export function mapSettlementsToInstructorMemberRows(
  items: SettlementListItemResponse[],
  statementIdBySettlementId?: ReadonlyMap<number, number>
): InstructorSettlementListRow[] {
  return items
    .map((item, index) =>
      mapSettlementItemToInstructorMemberRow(
        item,
        index,
        item.settlementId != null ? statementIdBySettlementId?.get(item.settlementId) : undefined
      )
    )
    .filter((row): row is InstructorSettlementListRow => row != null)
}
