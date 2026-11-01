import type { UjatVolunteerAssignmentProgressRow } from './assignment-types'

function withdrawScheduleValue(row: UjatVolunteerAssignmentProgressRow): string {
  return row.scheduleId != null ? String(row.scheduleId) : row.id
}

export function getVolunteerActivityWithdrawScheduleOptions(
  rows: readonly UjatVolunteerAssignmentProgressRow[]
): { value: string; label: string }[] {
  return rows
    .filter(row => row.classDisplay.kind !== 'withdrawn')
    .map(row => ({
      value: withdrawScheduleValue(row),
      label: row.scheduleLabel,
    }))
}

export function sortVolunteerAssignmentRows(
  rows: UjatVolunteerAssignmentProgressRow[]
): UjatVolunteerAssignmentProgressRow[] {
  const active = rows.filter(row => row.classDisplay.kind !== 'withdrawn')
  const classWithdrawn = rows.filter(row => row.classDisplay.kind === 'withdrawn')
  return [...active, ...classWithdrawn]
}
