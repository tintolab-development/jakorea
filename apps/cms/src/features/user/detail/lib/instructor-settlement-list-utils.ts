import dayjs from 'dayjs'
import type {
  InstructorSettlementListRow,
  SummarizeSettlementRowsOptions,
} from '@/features/user/detail/model/instructor-settlement-types'

export type { SummarizeSettlementRowsOptions }

export function settlementCalendarPrimaryTitle(row: InstructorSettlementListRow): string {
  if (row.settlementListTitleVariant === 'plain-instructor' && row.instructorName?.trim()) {
    return row.instructorName.trim()
  }
  if (row.instructorName?.trim()) {
    return `${row.instructorName.trim()} [${row.programName}]`
  }
  return `[${row.programName}]`
}

export function filterRowsByMonth(
  rows: InstructorSettlementListRow[],
  month: dayjs.Dayjs
): InstructorSettlementListRow[] {
  const y = month.year()
  const m = month.month()
  return rows.filter(r => {
    const d = dayjs(r.calendarDate)
    return d.isValid() && d.year() === y && d.month() === m
  })
}

function sumCompletedAmount(rows: InstructorSettlementListRow[]) {
  return rows.reduce((s, r) => s + (r.status === 'account_paid' ? r.scheduledAmount : 0), 0)
}

function sumScheduledPending(rows: InstructorSettlementListRow[]) {
  return rows.reduce((s, r) => {
    if (
      r.status === 'awaiting_confirmation' ||
      r.status === 'partial_confirmation' ||
      r.status === 'payment_statement_verified' ||
      r.status === 'payment_correction_requested'
    ) {
      return s + r.scheduledAmount
    }
    return s
  }, 0)
}

export function summarizeSettlementRows(
  rowsInMonth: InstructorSettlementListRow[],
  options?: SummarizeSettlementRowsOptions
) {
  const rowsForTotal = options?.allRowsForTotal ?? rowsInMonth
  return {
    totalCompleted: sumCompletedAmount(rowsForTotal),
    monthCompleted: sumCompletedAmount(rowsInMonth),
    scheduled: sumScheduledPending(rowsInMonth),
  }
}

export function rowsToCalendarEvents(rows: InstructorSettlementListRow[]): Array<{
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: InstructorSettlementListRow
}> {
  return rows.map(r => ({
    id: r.id,
    title: r.programName,
    startDate: `${r.calendarDate}T09:00:00`,
    endDate: `${r.calendarDate}T18:00:00`,
    originalItem: r,
  }))
}
