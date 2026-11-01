import dayjs from 'dayjs'
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

/** Figma: `4월 3일 (제이초등학교)` — isoDate 우선, 없으면 dateLabel 그대로 */
export function formatAttendanceManagerScheduleLabel(
  isoDate: string | undefined,
  dateLabel: string,
  institutionName: string
): string {
  const institution = institutionName.trim() || '-'
  const parsed = isoDate?.trim() ? dayjs(isoDate) : null
  const datePart =
    parsed?.isValid() === true
      ? `${parsed.month() + 1}월 ${parsed.date()}일`
      : dateLabel.trim() || '-'
  return `${datePart} (${institution})`
}

/** 일정(열)별 배정된 봉사자 목록 — 활동 포기자 제외 */
export function getRegionAttendanceManagerScheduleItemsFromData(
  data: RegionAssignmentTableData
): RegionAttendanceManagerScheduleItem[] {
  const { columns, rows } = data

  return columns.map((column, columnIndex) => {
    const volunteerOptions = rows
      .filter(row => {
        if (row.isWithdrawnVolunteer) return false
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
      label: formatAttendanceManagerScheduleLabel(
        column.isoDate,
        column.dateLabel,
        column.institutionName
      ),
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
