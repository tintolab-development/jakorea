import { isUjatAllocationAssignmentStatusAssigned } from '@/features/program/ujat/api/allocation-matrix-adapters'
import type { RegionAssignmentCell, RegionAssignmentTableData } from './types'

export type RegionAttendanceManagerSelectOption = {
  value: string
  label: string
}

export type RegionAttendanceManagerPut = {
  scheduleId: number
  participantId: number
}

/** 그 교육일(열)에 ASSIGNED인 봉사자만 출결 담당 후보 */
export function isRegionAttendanceManagerCandidateCell(
  cell: RegionAssignmentCell | undefined
): cell is Extract<RegionAssignmentCell, { kind: 'assigned' }> {
  return (
    cell?.kind === 'assigned' &&
    isUjatAllocationAssignmentStatusAssigned(cell.assignmentStatus)
  )
}

export type RegionAttendanceManagerScheduleItem = {
  columnId: string
  label: string
  volunteerOptions: RegionAttendanceManagerSelectOption[]
  currentManagerId?: string
}

export type RegionAttendanceManagerAssignments = Record<string, string>

function koreanMonthDayFromSeoulYmd(ymd: string | undefined): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd?.trim() ?? '')
  if (!match) return null
  return `${Number(match[2])}월 ${Number(match[3])}일`
}

/** Figma: `4월 3일 (제이초등학교)` — isoDate(YYYY-MM-DD, Asia/Seoul) 우선, 없으면 dateLabel */
export function formatAttendanceManagerScheduleLabel(
  isoDate: string | undefined,
  dateLabel: string,
  institutionName: string
): string {
  const institution = institutionName.trim() || '-'
  const datePart = koreanMonthDayFromSeoulYmd(isoDate) ?? (dateLabel.trim() || '-')
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
        return isRegionAttendanceManagerCandidateCell(row.cells[columnIndex])
      })
      .map(row => ({
        value: row.id,
        label: row.name,
      }))

    const currentManager = rows.find(row => {
      const cell = row.cells[columnIndex]
      return isRegionAttendanceManagerCandidateCell(cell) && cell.isAttendanceManager
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

/**
 * 출결 담당 PUT 목록. scheduleId당 1건.
 * ASSIGNED가 아닌 행·0·비유한 participantId는 보내지 않는다.
 */
export function collectAttendanceManagerPuts(
  data: RegionAssignmentTableData,
  assignments: RegionAttendanceManagerAssignments
): RegionAttendanceManagerPut[] {
  const byScheduleId = new Map<number, number>()

  for (const [columnId, volunteerId] of Object.entries(assignments)) {
    const columnIndex = data.columns.findIndex(column => column.id === columnId)
    if (columnIndex < 0) continue

    const scheduleId = Number(data.columns[columnIndex]?.scheduleId)
    const participantId = Number(volunteerId)
    if (!Number.isFinite(scheduleId) || scheduleId <= 0) continue
    if (!Number.isFinite(participantId) || participantId <= 0) continue

    const row = data.rows.find(item => item.id === volunteerId)
    if (!row || row.isWithdrawnVolunteer) continue
    if (!isRegionAttendanceManagerCandidateCell(row.cells[columnIndex])) continue

    byScheduleId.set(scheduleId, participantId)
  }

  return [...byScheduleId.entries()].map(([scheduleId, participantId]) => ({
    scheduleId,
    participantId,
  }))
}
