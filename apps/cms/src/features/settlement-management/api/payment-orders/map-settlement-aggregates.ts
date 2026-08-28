import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProcessingStatus,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type { SettlementAggregateResponse } from '@/shared/api/generated/settlement/schemas'
import { mapStatementStatusToProcessingStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'

type AggregateItem = SettlementAggregateResponse & {
  aggregateStatus?: string
  processingStatus?: string
}

function deriveProcessingStatus(
  pendingCount: number,
  participationCount: number
): PaymentOrderAdminProcessingStatus {
  if (participationCount > 0 && pendingCount <= 0) return 'confirmed'
  return 'pending'
}

function resolveAggregateProcessingStatus(
  item: AggregateItem,
  pendingCount: number,
  participationCount: number
): PaymentOrderAdminProcessingStatus {
  const raw = item.aggregateStatus ?? item.processingStatus
  if (raw) return mapStatementStatusToProcessingStatus(raw)
  return deriveProcessingStatus(pendingCount, participationCount)
}

function referenceDateFromDates(dates: string[]): string {
  return dates.length > 0 ? [...dates].sort()[0]! : ''
}

export function mapAggregatesToProgramRows(
  items: SettlementAggregateResponse[]
): PaymentOrderAdminProgramRow[] {
  const rows = items.flatMap((item, index): PaymentOrderAdminProgramRow[] => {
    const programId = item.programId ?? item.aggregateKey
    if (programId == null) return []
    const dates = item.settlementRelevantAttendanceDates ?? []
    const pending = item.pendingPaymentSettlementItemCount ?? 0
    const participation = item.participationCount ?? item.instructorCount ?? 0
    return [
      {
        no: index + 1,
        programId: typeof programId === 'number' ? programId : Number(programId),
        aggregateKey: String(programId),
        programName: item.programName ?? `프로그램 ${programId}`,
        instructorCount: item.instructorCount ?? 0,
        processingStatus: resolveAggregateProcessingStatus(item, pending, participation),
        estimatedAmount: item.estimatedAmount ?? 0,
        referenceDate: referenceDateFromDates(dates),
        settlementRelevantAttendanceDates: dates,
        pendingPaymentSettlementItemCount: pending,
      },
    ]
  })

  return rows
    .sort((a, b) => a.programName.localeCompare(b.programName, 'ko'))
    .map((row, index) => ({ ...row, no: index + 1 }))
}

export function mapAggregatesToInstructorRows(
  items: SettlementAggregateResponse[]
): PaymentOrderAdminInstructorRow[] {
  const rows = items.flatMap((item, index): PaymentOrderAdminInstructorRow[] => {
    const instructorMemberId = item.instructorMemberId ?? item.aggregateKey
    if (instructorMemberId == null) return []
    const dates = item.settlementRelevantAttendanceDates ?? []
    const pending = item.pendingPaymentSettlementItemCount ?? 0
    const participation = item.participationCount ?? 0
    return [
      {
        no: index + 1,
        instructorMemberId:
          typeof instructorMemberId === 'number' ? instructorMemberId : Number(instructorMemberId),
        aggregateKey: String(instructorMemberId),
        instructorName: item.instructorName ?? `강사 ${instructorMemberId}`,
        programCount: participation,
        processingStatus: resolveAggregateProcessingStatus(item, pending, participation),
        estimatedAmount: item.estimatedAmount ?? 0,
        relatedProgramNames: [],
        referenceDate: referenceDateFromDates(dates),
        settlementRelevantAttendanceDates: dates,
        pendingPaymentSettlementItemCount: pending,
        calendarSlotStartTime: undefined,
        calendarSlotEndTime: undefined,
        calendarWeekGridLabel: undefined,
      },
    ]
  })

  return rows
    .sort((a, b) => a.instructorName.localeCompare(b.instructorName, 'ko'))
    .map((row, index) => ({ ...row, no: index + 1 }))
}
