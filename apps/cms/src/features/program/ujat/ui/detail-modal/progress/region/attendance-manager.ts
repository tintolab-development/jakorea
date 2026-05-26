import type { RegionAssignmentTableData } from './types'

export type RegionAttendanceManagerSelectOption = {
  value: string
  label: string
}

export type RegionAttendanceManagerScheduleItem = {
  columnId: string
  label: string
  volunteerOptions: RegionAttendanceManagerSelectOption[]
  currentManagerId?: string
}

export type RegionAttendanceManagerAssignments = Record<string, string>

function formatScheduleLabel(dateLabel: string, institutionName: string): string {
  return `${dateLabel} (${institutionName})`
}

/** 배정 불가일 제외 — 일정(열)별 배정된 봉사자 목록 */
export function getRegionAttendanceManagerScheduleItemsFromData(
  data: RegionAssignmentTableData
): RegionAttendanceManagerScheduleItem[] {
  const { columns, rows } = data

  return columns
    .map((column, columnIndex) => ({ column, columnIndex }))
    .filter(({ column }) => !column.isBlockedDate)
    .map(({ column, columnIndex }) => {
      const volunteerOptions = rows
        .filter(row => {
          if (row.isWithdrawnVolunteer) return false
          if (
            row.withdrawnFromColumnIndex != null &&
            columnIndex >= row.withdrawnFromColumnIndex
          ) {
            return false
          }
          const cell = row.cells[columnIndex]
          return cell?.kind === 'assigned'
        })
        .map(row => ({
          value: row.id,
          label: row.name,
        }))

      const currentManager = rows.find(row => {
        const cell = row.cells[columnIndex]
        return cell?.kind === 'assigned' && cell.isAttendanceManager
      })

      return {
        columnId: column.id,
        label: formatScheduleLabel(column.dateLabel, column.institutionName),
        volunteerOptions,
        currentManagerId: currentManager?.id,
      }
    })
}

export function applyRegionAttendanceManagersFromData(
  data: RegionAssignmentTableData,
  assignments: RegionAttendanceManagerAssignments
): RegionAssignmentTableData {
  const rows = data.rows.map(row => ({
    ...row,
    cells: row.cells.map(cell => {
      if (cell.kind !== 'assigned') return cell
      return { ...cell, isAttendanceManager: false }
    }),
  }))

  for (const [columnId, volunteerId] of Object.entries(assignments)) {
    const columnIndex = data.columns.findIndex(column => column.id === columnId)
    if (columnIndex < 0) continue

    const rowIndex = rows.findIndex(row => row.id === volunteerId)
    if (rowIndex < 0) continue

    const cell = rows[rowIndex].cells[columnIndex]
    if (cell?.kind !== 'assigned') continue

    rows[rowIndex] = {
      ...rows[rowIndex],
      cells: rows[rowIndex].cells.map((c, index) => {
        if (index !== columnIndex || c.kind !== 'assigned') return c
        return { ...c, isAttendanceManager: true }
      }),
    }
  }

  return { ...data, rows }
}
