import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  formatIndividualSettlementWon,
  individualSettlementReviewStatusLabel,
  normalizeIndividualSettlementReviewStatus,
} from '@/features/program/general/lib/individual-settlement-review-status'
import {
  INDIVIDUAL_SETTLEMENT_APPLICATION_SOURCE_TYPE,
  PAYMENT_ORDER_INDIVIDUAL_LIST_STATUSES,
} from '@/features/settlement-management/lib/payment-order-individual-source'

export type PaymentOrderIndividualRow = {
  sourceType: typeof INDIVIDUAL_SETTLEMENT_APPLICATION_SOURCE_TYPE
  id: string
  no: number
  settlementApplicationId: number
  programId: number | null
  participantId: number | null
  applicantName: string
  educationScheduleLabel: string
  status: string
  statusLabel: string
  totalAmount: number | null
  totalAmountLabel: string
  latestRevisionNoLabel: string
}

function positiveId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

export function isPaymentOrderIndividualListStatus(status: string | null | undefined): boolean {
  const key = normalizeIndividualSettlementReviewStatus(status)
  return (PAYMENT_ORDER_INDIVIDUAL_LIST_STATUSES as readonly string[]).includes(key)
}

export function mapPaymentOrderIndividualRows(
  items: ReadonlyArray<IndividualSettlementReviewListItem>
): PaymentOrderIndividualRow[] {
  return items
    .filter(item => isPaymentOrderIndividualListStatus(item.status))
    .map((item, index) => {
      const settlementApplicationId = positiveId(item.settlementApplicationId) ?? 0
      const totalAmount =
        typeof item.totalAmount === 'number' && Number.isFinite(item.totalAmount)
          ? item.totalAmount
          : null
      const scheduleName = item.scheduleName?.trim()
      return {
        sourceType: INDIVIDUAL_SETTLEMENT_APPLICATION_SOURCE_TYPE,
        id: `individual-settlement-application:${settlementApplicationId}`,
        no: index + 1,
        settlementApplicationId,
        programId: positiveId(item.programId),
        participantId: positiveId(item.participantId),
        applicantName: item.memberName?.trim() || '-',
        educationScheduleLabel: scheduleName ? formatCmsScheduleDisplayLabel(scheduleName) : '-',
        status: normalizeIndividualSettlementReviewStatus(item.status),
        statusLabel: individualSettlementReviewStatusLabel(item.status),
        totalAmount,
        totalAmountLabel: formatIndividualSettlementWon(totalAmount),
        latestRevisionNoLabel:
          typeof item.latestRevisionNo === 'number' ? String(item.latestRevisionNo) : '-',
      }
    })
    .filter(row => row.settlementApplicationId > 0)
}

export function sumPaymentOrderIndividualAmounts(rows: ReadonlyArray<PaymentOrderIndividualRow>): number | null {
  let sum = 0
  let hasAmount = false
  for (const row of rows) {
    if (row.totalAmount == null) continue
    hasAmount = true
    sum += row.totalAmount
  }
  return hasAmount ? sum : null
}
