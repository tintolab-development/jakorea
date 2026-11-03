import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewItem'
import type { IndividualSettlementReviewReceipt } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewReceipt'
import type {
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementProgramBasicInfo,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import {
  INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL,
  individualSettlementReviewStatusLabel,
  isIndividualSettlementLodgingType,
  latestIndividualSettlementReviewRevision,
  normalizeIndividualSettlementReviewStatus,
} from './individual-settlement-review-status'
import { formatCmsScheduleDisplayLabel } from './organization-preferred-schedule-label'
import { mapIndividualSettlementItemToBasisDetail } from './map-individual-settlement-review-basis-detail'

export type IndividualSettlementCalculationStatementView = {
  basic: PaymentOrderCalculationStatementProgramBasicInfo
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  receiptsByItemId: Record<string, IndividualSettlementReviewReceipt[]>
}

function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export function mapIndividualSettlementItemKind(
  itemType: string | null | undefined
): PaymentOrderCalculationLineKind {
  const key = (itemType ?? '').trim().toUpperCase()
  if (key === 'TRANSPORT' || key === 'TRAVEL' || key.includes('TRANSPORT')) return 'travel'
  if (key === 'LODGING' || key.includes('LODGING') || key.includes('STAY')) return 'lodging'
  if (key === 'MEAL' || key.includes('MEAL') || key.includes('FOOD')) return 'meal'
  if (key === 'WITHHOLDING' || key.includes('WITHHOLD') || key.includes('TAX')) return 'withholding'
  if (key === 'ACTIVITY' || key.includes('ACTIVITY')) return 'activity'
  if (
    key === 'LECTURE' ||
    key === 'LECTURE_FEE' ||
    key === 'WAGE' ||
    key.includes('LECTURE')
  ) {
    return 'lecture_fee'
  }
  return 'activity'
}

export function mapIndividualSettlementProcessingStatusClass(
  status: string | null | undefined
): PaymentOrderAdminLineProcessingStatus {
  const key = normalizeIndividualSettlementReviewStatus(status)
  if (key === 'APPROVED') return 'confirmed'
  if (key === 'REJECTED') return 'application_rejected'
  if (key === 'SUBMITTED') return 'pending'
  return 'pending'
}

function itemLabel(item: IndividualSettlementReviewItem): string {
  const name = item.itemName?.trim() || '-'
  if (isIndividualSettlementLodgingType(item.itemType)) {
    return `${name} (${INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL})`
  }
  return name
}

function extractSessionLabel(scheduleName: string | undefined): string {
  const source = formatCmsScheduleDisplayLabel(scheduleName?.trim() || '') || scheduleName || ''
  const match = source.match(/(\d+\s*회차|\d+\s*~\s*\d+\s*회차)/u)
  return match?.[1]?.replace(/\s+/g, '') ?? ''
}

export type IndividualSettlementReviewBasicExtras = {
  programSessionProgressDisplay?: string | null
  businessPeriodDisplay?: string | null
}

export function mapIndividualSettlementReviewToCalculationStatement(
  detail: IndividualSettlementReviewDetail,
  extras?: IndividualSettlementReviewBasicExtras
): IndividualSettlementCalculationStatementView {
  const latest = latestIndividualSettlementReviewRevision(detail)
  const items = latest?.items ?? []
  const programName = displayOrDash(detail.programName)
  const lectureDateDisplay = detail.scheduleStartAt
    ? formatDateDotWithWeekday(detail.scheduleStartAt)
    : displayOrDash(formatCmsScheduleDisplayLabel(detail.scheduleName ?? '') || detail.scheduleName)
  const lectureSessionDisplay = extractSessionLabel(detail.scheduleName)
  const receiptsByItemId: Record<string, IndividualSettlementReviewReceipt[]> = {}

  const lines = items.map(item => {
    const id = String(item.itemId)
    receiptsByItemId[id] = item.receipts ?? []
    const kind = mapIndividualSettlementItemKind(item.itemType)
    const amount = Number.isFinite(item.amount) ? item.amount : 0
    return {
      id,
      itemLabel: itemLabel(item),
      // 관리자 상세 GET items[].description = 정산 항목 설정 카탈로그. receipts/expenses 메모는 쓰지 않는다.
      description: displayOrDash(item.description),
      amount: kind === 'withholding' && amount > 0 ? -amount : amount,
      kind,
      basisDetail: mapIndividualSettlementItemToBasisDetail(item, kind),
    }
  })

  const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0)
  const plusLabels = lines.filter(line => line.amount >= 0).map(line => line.itemLabel)
  const minusLabels = lines.filter(line => line.amount < 0).map(line => line.itemLabel)
  const formulaLabel =
    plusLabels.length === 0 && minusLabels.length === 0
      ? '-'
      : [plusLabels.join(' + '), minusLabels.length > 0 ? minusLabels.join(' - ') : '']
          .filter(Boolean)
          .join(' - ')

  const rejectionReason = latest?.rejectionReason?.trim()
  const status = latest?.status ?? detail.status

  return {
    basic: {
      programName,
      instructorNameKo: displayOrDash(detail.memberName),
      businessPeriodDisplay: displayOrDash(extras?.businessPeriodDisplay),
      programSessionProgressDisplay: displayOrDash(extras?.programSessionProgressDisplay),
      processingStatusDisplay: individualSettlementReviewStatusLabel(status),
      processingStatusClass: mapIndividualSettlementProcessingStatusClass(status),
      processingRejectionReason: rejectionReason || undefined,
      lectureFeeStandardTitle: '-',
      lectureFeeStandardAmount: '',
      businessIncomeEarnerLabel: '-',
    },
    blocks:
      lines.length === 0
        ? []
        : [
            {
              institutionName: programName,
              lectureDateDisplay: lectureDateDisplay === '' ? '-' : lectureDateDisplay,
              lectureSessionDisplay,
              lines,
            },
          ],
    formulaLabel,
    totalAmount,
    receiptsByItemId,
  }
}
