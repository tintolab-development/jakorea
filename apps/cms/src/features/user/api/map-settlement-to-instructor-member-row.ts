import { formatDateDot, formatDateDotWithWeekday } from '@/shared/utils/date'
import type {
  SettlementFrontendItemResponse,
  SettlementFrontendResponse,
  SettlementListItemResponse,
} from '@/shared/api/generated/settlement/schemas'
import type {
  InstructorSettlementInvoiceDetail,
  InstructorSettlementInvoiceLineItem,
  InstructorSettlementListRow,
  InstructorSettlementUiStatus,
} from '@/features/user/detail/model/instructor-settlement-types'
import { mapStatementStatusToProcessingStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'
import {
  formatBusinessIncomeEarnerLabel,
  formatBusinessPeriodDisplay,
  resolveLectureFeeStandardTitleFromSettlement,
  formatProgramSessionProgressDisplay,
  mapCalculationDetailToBasisDetail,
  mapSettlementFrontendItemTypeToLineKind,
  prepareSettlementFrontendItemsForStatement,
  resolveLectureFeeStandardAmountDisplay,
} from '@/features/settlement-management/api/shared/map-frontend-fields'
import { resolveCanonicalLectureSessionDisplay } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'

function paymentOrderStatusToInstructorUiStatus(
  s: ReturnType<typeof mapStatementStatusToProcessingStatus>
): InstructorSettlementUiStatus {
  switch (s) {
    case 'pending':
      return 'awaiting_confirmation'
    case 'reapplication':
      return 'payment_statement_reapplication'
    case 'partial':
      return 'partial_confirmation'
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

/** 강사 회원 상세 정산 탭·프로그램 참여 강사 — OpenAPI `statementStatus` + `paymentStatus` → 8종 UI key */
export function resolveSettlementUiStatus(
  item: SettlementListItemResponse
): InstructorSettlementUiStatus {
  const paymentStatus = item.paymentStatus?.toUpperCase()
  const statementStatus = item.statementStatus?.toUpperCase()

  if (paymentStatus === 'PAID') {
    return 'account_paid'
  }
  if (paymentStatus === 'CORRECTION_REQUESTED') {
    return 'payment_correction_requested'
  }
  /**
   * 지급조서 확인 완료 후 계좌 이체 대기.
   * bulk-confirm은 WAITING_CONFIRM|REAPPLICATION만 허용하므로
   * CONFIRMED+WAITING_PAYMENT를 확인 대기로 두면 확인 CTA가 남아 409 CONFLICT가 난다.
   * (라인 매핑 `mapSettlementAxesToLineStatus`의 awaiting_payment과 동일 계약)
   */
  if (statementStatus === 'CONFIRMED' && paymentStatus === 'WAITING_PAYMENT') {
    return 'payment_statement_verified'
  }
  if (paymentStatus === 'CONFIRMED') {
    if (statementStatus === 'PARTIAL' || statementStatus === 'PARTIAL_CONFIRMED') {
      return 'partial_confirmation'
    }
    return 'payment_statement_verified'
  }
  return paymentOrderStatusToInstructorUiStatus(
    mapStatementStatusToProcessingStatus(item.statementStatus)
  )
}

function mapItemToLine(
  item: SettlementFrontendItemResponse,
  index: number
): InstructorSettlementInvoiceLineItem {
  const amount = item.amount ?? 0
  const kind = mapSettlementFrontendItemTypeToLineKind(item.type, amount)
  return {
    key: `item-${index}`,
    산정항목: formatPaymentOrderCalculationItemLabel(item.type, amount),
    항목설명: item.description?.trim() || '—',
    정산금액: Math.abs(amount),
    isPositive: kind !== 'withholding' && amount >= 0,
    kind,
    basisDetail: mapCalculationDetailToBasisDetail(item.calculationDetail),
  }
}

function formatIsoDate(iso?: string): string {
  if (!iso?.trim()) return '-'
  const label = formatDateDot(iso.slice(0, 10))
  return label === '-' ? iso : label
}

function formatIsoDateWithWeekday(iso?: string): string {
  if (!iso?.trim()) return '-'
  const label = formatDateDotWithWeekday(iso.slice(0, 10))
  return label === '-' ? iso : label
}

export function mapSettlementDetailToInstructorInvoice(
  settlement: SettlementFrontendResponse,
  listItem: SettlementListItemResponse,
  status: InstructorSettlementUiStatus
): InstructorSettlementInvoiceDetail {
  const programName =
    settlement.programNameKo?.trim() || listItem.programNameKo?.trim() || '프로그램'
  const items = prepareSettlementFrontendItemsForStatement(settlement.items)
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
            kind: 'lecture_fee' as const,
          },
        ]

  const withholdingLine = lineItems.find(
    line => line.kind === 'withholding' || line.산정항목.includes('원천')
  )
  const withholdingAmount =
    listItem.withholdingTaxAmount ?? (withholdingLine ? Math.abs(withholdingLine.정산금액) : 0)
  const totalAmount = settlement.totalAmount ?? listItem.netPaymentAmount ?? 0
  const lectureDate = formatIsoDateWithWeekday(listItem.lectureDate)
  const lectureFeeTitle = resolveLectureFeeStandardTitleFromSettlement(settlement)
  const lectureFeeAmount = resolveLectureFeeStandardAmountDisplay(
    settlement.lectureFeeStandardAmount,
    settlement.items
  )
  // taxIncomeType(BUSINESS_INCOME 등)은 소득 구분 — 강사비 책정 기준 라벨로 쓰지 않는다.
  const lectureFeeBasis =
    lectureFeeTitle !== '-'
      ? [lectureFeeTitle, lectureFeeAmount !== '-' ? lectureFeeAmount : '']
          .filter(Boolean)
          .join(' | ')
      : '-'

  const sessionOrdinal = settlement.sessionOrdinal ?? listItem.sessionOrdinal
  const sessionLabel = resolveCanonicalLectureSessionDisplay(
    settlement.lectureSessionDisplay,
    sessionOrdinal
  )
  const lectureDateSessions =
    sessionLabel !== '-' ? `${lectureDate} | ${sessionLabel}` : lectureDate

  return {
    programName,
    sessionProgress: formatProgramSessionProgressDisplay({
      programSessionProgressDisplay:
        settlement.programSessionProgressDisplay ?? listItem.programSessionProgressDisplay,
      sessionCompleted: settlement.sessionCompleted ?? listItem.sessionCompleted,
      sessionTotal: settlement.sessionTotal ?? listItem.sessionTotal,
    }),
    operationPeriod: formatBusinessPeriodDisplay({
      period: settlement.period,
      businessPeriodStart: settlement.businessPeriodStart ?? listItem.businessPeriodStart,
      businessPeriodEnd: settlement.businessPeriodEnd ?? listItem.businessPeriodEnd,
      formatDate: formatIsoDateWithWeekday,
    }),
    paymentStatementStatus: status,
    expectedTransferDate: formatIsoDate(
      settlement.expectedTransferDate ?? listItem.expectedTransferDate
    ),
    lectureFeeBasis,
    businessIncomeEarner: formatBusinessIncomeEarnerLabel(settlement.businessIncomeEarnerLabel),
    institutionName: settlement.institutionName?.trim() || listItem.institutionName?.trim() || '-',
    lectureDateSessions,
    lineItems: lineItems.filter(
      line => line.kind !== 'withholding' && !line.산정항목.includes('원천')
    ),
    withholdingRatePercent: withholdingAmount > 0 ? 8.8 : 0,
    withholdingAmount,
    totalFormulaLabel: '정산 항목 합계',
    totalAmount,
    withholdingBasisDetail: withholdingLine?.basisDetail,
  }
}

export function mapSettlementItemToInstructorMemberRow(
  item: SettlementListItemResponse,
  index: number,
  statementIdBySettlementId?: ReadonlyMap<number, number>
): InstructorSettlementListRow | null {
  const settlementId = item.settlementId
  if (settlementId == null) return null

  const statementId =
    item.statementId ??
    (statementIdBySettlementId != null ? statementIdBySettlementId.get(settlementId) : undefined)

  const status = resolveSettlementUiStatus(item)
  const programName = item.programNameKo?.trim() || `프로그램 ${item.programId ?? ''}`
  const calendarDate =
    item.lectureDate?.slice(0, 10) ?? item.expectedTransferDate?.slice(0, 10) ?? ''

  return {
    id: String(settlementId),
    settlementId,
    statementId,
    correctionRequestId: item.settlementCorrectionRequestId,
    no: index + 1,
    programName,
    instructorName: item.instructorName?.trim(),
    institutionName: item.institutionName?.trim() || '-',
    lectureDateDisplay: calendarDate || '-',
    calendarDate: calendarDate || new Date().toISOString().slice(0, 10),
    status,
    scheduledAmount: item.netPaymentAmount ?? item.grossAmount ?? 0,
    detailAvailable: status !== 'none',
    invoice: mapSettlementDetailToInstructorInvoice(
      { items: [], totalAmount: item.netPaymentAmount },
      item,
      status
    ),
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
      mapSettlementItemToInstructorMemberRow(item, index, statementIdBySettlementId)
    )
    .filter((row): row is InstructorSettlementListRow => row != null)
}
