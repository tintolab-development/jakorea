import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import {
  isPendingStatementStatus,
  mapStatementStatusToProcessingStatus,
} from '@/features/settlement-management/api/shared/settlement-status-mappers'

function aggregateProcessingStatus(
  items: SettlementListItemResponse[]
): PaymentOrderAdminProgramRow['processingStatus'] {
  const statuses = items.map(i => mapStatementStatusToProcessingStatus(i.statementStatus))
  if (statuses.some(s => s === 'correction')) return 'correction'
  if (statuses.some(s => s === 'application_rejected')) return 'application_rejected'
  if (statuses.some(s => s === 'pending')) return 'pending'
  if (statuses.every(s => s === 'confirmed')) return 'confirmed'
  return 'pending'
}

function collectAttendanceDates(items: SettlementListItemResponse[]): string[] {
  const dates = items
    .map(i => i.lectureDate)
    .filter((d): d is string => Boolean(d))
  return [...new Set(dates)].sort()
}

function sumNetAmount(items: SettlementListItemResponse[]): number {
  return items.reduce((sum, i) => sum + (i.netPaymentAmount ?? 0), 0)
}

function countPendingItems(items: SettlementListItemResponse[]): number {
  return items.filter(i => isPendingStatementStatus(i.statementStatus)).length
}

export function mapSettlementsToProgramRows(
  items: SettlementListItemResponse[]
): PaymentOrderAdminProgramRow[] {
  const byProgram = new Map<number, SettlementListItemResponse[]>()

  for (const item of items) {
    const programId = item.programId
    if (programId == null) continue
    const bucket = byProgram.get(programId) ?? []
    bucket.push(item)
    byProgram.set(programId, bucket)
  }

  return [...byProgram.entries()]
    .map(([programId, group], index) => {
      const dates = collectAttendanceDates(group)
      const instructorIds = new Set(
        group.map(i => i.instructorMemberId).filter((id): id is number => id != null)
      )
      return {
        no: index + 1,
        programId,
        aggregateKey: String(programId),
        programName: group[0]?.programNameKo ?? `프로그램 ${programId}`,
        instructorCount: instructorIds.size,
        processingStatus: aggregateProcessingStatus(group),
        estimatedAmount: sumNetAmount(group),
        referenceDate: dates[0] ?? '',
        settlementRelevantAttendanceDates: dates,
        pendingPaymentSettlementItemCount: countPendingItems(group),
      }
    })
    .sort((a, b) => a.programName.localeCompare(b.programName, 'ko'))
    .map((row, index) => ({ ...row, no: index + 1 }))
}

export function mapSettlementsToInstructorRows(
  items: SettlementListItemResponse[]
): PaymentOrderAdminInstructorRow[] {
  const byInstructor = new Map<number, SettlementListItemResponse[]>()

  for (const item of items) {
    const instructorMemberId = item.instructorMemberId
    if (instructorMemberId == null) continue
    const bucket = byInstructor.get(instructorMemberId) ?? []
    bucket.push(item)
    byInstructor.set(instructorMemberId, bucket)
  }

  return [...byInstructor.entries()]
    .map(([instructorMemberId, group], index) => {
      const dates = collectAttendanceDates(group)
      const programNames = [
        ...new Set(group.map(i => i.programNameKo).filter((n): n is string => Boolean(n))),
      ]
      const programIds = new Set(
        group.map(i => i.programId).filter((id): id is number => id != null)
      )
      return {
        no: index + 1,
        instructorMemberId,
        aggregateKey: String(instructorMemberId),
        instructorName: group[0]?.instructorName ?? `강사 ${instructorMemberId}`,
        programCount: programIds.size,
        processingStatus: aggregateProcessingStatus(group),
        estimatedAmount: sumNetAmount(group),
        relatedProgramNames: programNames,
        referenceDate: dates[0] ?? '',
        settlementRelevantAttendanceDates: dates,
        pendingPaymentSettlementItemCount: countPendingItems(group),
        calendarSlotStartTime: undefined,
        calendarSlotEndTime: undefined,
        calendarWeekGridLabel: undefined,
      }
    })
    .sort((a, b) => a.instructorName.localeCompare(b.instructorName, 'ko'))
    .map((row, index) => ({ ...row, no: index + 1 }))
}
