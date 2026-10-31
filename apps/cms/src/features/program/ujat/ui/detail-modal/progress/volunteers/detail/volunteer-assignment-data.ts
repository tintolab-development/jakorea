import type { UjatVolunteerAssignmentProgressRow } from './assignment-types'

function withdrawScheduleValue(row: UjatVolunteerAssignmentProgressRow): string {
  return row.scheduleId != null ? String(row.scheduleId) : row.id
}

export function getVolunteerActivityWithdrawScheduleOptions(
  rows: readonly UjatVolunteerAssignmentProgressRow[],
  additionalWithdrawnRowIds: ReadonlyArray<string> = []
): { value: string; label: string }[] {
  const withdrawnIdSet = new Set(additionalWithdrawnRowIds)

  return rows
    .filter(row => {
      if (row.classDisplay.kind === 'withdrawn') return false
      return !withdrawnIdSet.has(row.id) && !withdrawnIdSet.has(withdrawScheduleValue(row))
    })
    .map(row => ({
      value: withdrawScheduleValue(row),
      label: row.scheduleLabel,
    }))
}

export function mergeVolunteerActivityWithdrawnRows(
  rows: UjatVolunteerAssignmentProgressRow[],
  withdrawnScheduleRowIds: ReadonlyArray<string>
): UjatVolunteerAssignmentProgressRow[] {
  if (withdrawnScheduleRowIds.length === 0) {
    return sortVolunteerAssignmentRows(rows)
  }

  const withdrawnIdSet = new Set(withdrawnScheduleRowIds)

  return sortVolunteerAssignmentRows(
    rows.map(row => {
      const matches =
        withdrawnIdSet.has(row.id) ||
        (row.scheduleId != null && withdrawnIdSet.has(String(row.scheduleId)))
      if (!matches || row.classDisplay.kind === 'withdrawn') {
        return row
      }

      return {
        ...row,
        classDisplay: { kind: 'withdrawn' as const },
        isWithdrawn: true,
      }
    })
  )
}

export function sortVolunteerAssignmentRows(
  rows: UjatVolunteerAssignmentProgressRow[]
): UjatVolunteerAssignmentProgressRow[] {
  const active = rows.filter(row => row.classDisplay.kind !== 'withdrawn')
  const classWithdrawn = rows.filter(row => row.classDisplay.kind === 'withdrawn')
  return [...active, ...classWithdrawn]
}
