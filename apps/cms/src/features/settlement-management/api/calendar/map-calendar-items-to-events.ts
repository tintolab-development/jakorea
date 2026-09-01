import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProcessingStatus,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderCalendarEvent } from '@/features/settlement/ui/payment-record/payment-orders-calendar-view'
import { mapStatementStatusToProcessingStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import type { SettlementCalendarItemResponse } from '@/shared/api/generated/settlement/schemas'

const STATUS_PRIORITY: Record<PaymentOrderAdminProcessingStatus, number> = {
  correction: 6,
  application_rejected: 5,
  reapplication: 4,
  partial: 3,
  pending: 2,
  confirmed: 1,
}

function pickHigherPriorityStatus(
  current: PaymentOrderAdminProcessingStatus,
  next: PaymentOrderAdminProcessingStatus
): PaymentOrderAdminProcessingStatus {
  return (STATUS_PRIORITY[next] ?? 0) > (STATUS_PRIORITY[current] ?? 0) ? next : current
}

function instructorDisplayTitle(name: string): string {
  const n = name.trim()
  return n ? `${n} 강사` : '강사'
}

function findProgramRow(
  programRows: PaymentOrderAdminProgramRow[],
  programId: number | undefined
): PaymentOrderAdminProgramRow | undefined {
  if (programId == null) return undefined
  return programRows.find(r => r.programId === programId)
}

function findInstructorRow(
  instructorRows: PaymentOrderAdminInstructorRow[],
  instructorMemberId: number | undefined
): PaymentOrderAdminInstructorRow | undefined {
  if (instructorMemberId == null) return undefined
  return instructorRows.find(r => r.instructorMemberId === instructorMemberId)
}

export function mapCalendarItemsToProgramEvents(
  items: SettlementCalendarItemResponse[],
  programRows: PaymentOrderAdminProgramRow[]
): PaymentOrderCalendarEvent[] {
  const grouped = new Map<
    string,
    {
      item: SettlementCalendarItemResponse
      amount: number
      status: PaymentOrderAdminProcessingStatus
      instructorIds: Set<number>
    }
  >()

  for (const item of items) {
    const date = item.date
    const programId = item.programId
    if (!date || programId == null) continue

    if (!findProgramRow(programRows, programId)) continue

    const key = `${programId}|${date}`
    const status = mapStatementStatusToProcessingStatus(item.statementStatus)
    const existing = grouped.get(key)
    if (!existing) {
      grouped.set(key, {
        item,
        amount: item.expectedAmount ?? 0,
        status,
        instructorIds: new Set(
          item.instructorMemberId != null ? [item.instructorMemberId] : []
        ),
      })
      continue
    }

    existing.amount += item.expectedAmount ?? 0
    existing.status = pickHigherPriorityStatus(existing.status, status)
    if (item.instructorMemberId != null) {
      existing.instructorIds.add(item.instructorMemberId)
    }
  }

  return [...grouped.entries()].map(([key, group]) => {
    const { item, amount, status, instructorIds } = group
    const date = dayjs(item.date)
    const programRow = findProgramRow(programRows, item.programId)!

    return {
      id: `program-api-${key}`,
      date,
      exposure: 'program' as const,
      status,
      amount,
      bracketTitle: programRow.programName,
      cardSubtitle: `정산 대상 강사 ${instructorIds.size || programRow.instructorCount}명`,
      filterKey: programRow.programName,
      sourceProgramRow: programRow,
    }
  })
}

export function mapCalendarItemsToInstructorEvents(
  items: SettlementCalendarItemResponse[],
  instructorRows: PaymentOrderAdminInstructorRow[]
): PaymentOrderCalendarEvent[] {
  const out: PaymentOrderCalendarEvent[] = []

  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    if (!item.date) continue

    const instructorRow = findInstructorRow(instructorRows, item.instructorMemberId)
    if (!instructorRow) continue

    out.push({
      id: `instructor-api-${item.settlementId ?? index}-${item.date}`,
      date: dayjs(item.date),
      exposure: 'instructor' as const,
      status: mapStatementStatusToProcessingStatus(item.statementStatus),
      amount: item.expectedAmount ?? 0,
      bracketTitle: instructorDisplayTitle(instructorRow.instructorName),
      cardSubtitle: item.programNameKo ?? instructorRow.relatedProgramNames.join(', '),
      filterKey: instructorRow.instructorName,
      sourceInstructorRow: instructorRow,
    })
  }

  return out
}

export function mapCalendarItemsToPaymentOrderEvents(
  items: SettlementCalendarItemResponse[],
  exposure: 'program' | 'instructor',
  programRows: PaymentOrderAdminProgramRow[],
  instructorRows: PaymentOrderAdminInstructorRow[]
): PaymentOrderCalendarEvent[] {
  return exposure === 'program'
    ? mapCalendarItemsToProgramEvents(items, programRows)
    : mapCalendarItemsToInstructorEvents(items, instructorRows)
}

export function calendarRangeFromFilter(
  filterDateRange: [Dayjs, Dayjs] | null | undefined,
  fallbackMonth: Dayjs
): { fromDate: string; toDate: string } {
  if (filterDateRange?.[0] && filterDateRange[1]) {
    return {
      fromDate: filterDateRange[0].format('YYYY-MM-DD'),
      toDate: filterDateRange[1].format('YYYY-MM-DD'),
    }
  }
  const start = fallbackMonth.startOf('month')
  const end = start.add(1, 'month').subtract(1, 'day')
  return {
    fromDate: start.format('YYYY-MM-DD'),
    toDate: end.format('YYYY-MM-DD'),
  }
}
