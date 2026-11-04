import { isUjatAllocationAssignmentStatusAssigned } from '@/features/program/ujat/api/allocation-matrix-adapters'
import type { RegionAssignmentCell, RegionAssignmentTableData } from './types'

export type RegionAttendanceManagerSelectOption = {
  value: string
  label: string
}

export type RegionAttendanceManagerPut = {
  scheduleId: number
  participantId: number | null
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

export type RegionAttendanceManagerAssignments = Record<string, string | null>

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

export const ATTENDANCE_MANAGER_PUTS_EMPTY_MESSAGE =
  '출결 담당자를 저장할 교육 일정이 없습니다. 배정표를 새로고침해 주세요.'

/**
 * 출결 담당 PUT 목록. scheduleId당 1건.
 * ASSIGNED가 아닌 행·0·비유한 participantId는 보내지 않는다.
 * 뱃지는 PUT 응답/로컬 overlay가 아니라 GET allocation-matrix cells.attendanceManager 만 쓴다.
 */
export function collectAttendanceManagerPuts(
  data: RegionAssignmentTableData,
  assignments: RegionAttendanceManagerAssignments
): RegionAttendanceManagerPut[] {
  const byScheduleId = new Map<number, number | null>()

  for (const [columnId, volunteerId] of Object.entries(assignments)) {
    const columnIndex = data.columns.findIndex(column => column.id === columnId)
    if (columnIndex < 0) continue

    const scheduleId = Number(data.columns[columnIndex]?.scheduleId)
    if (!Number.isFinite(scheduleId) || scheduleId <= 0) continue

    if (volunteerId === null) {
      if (!byScheduleId.has(scheduleId)) byScheduleId.set(scheduleId, null)
      continue
    }

    const participantId = Number(volunteerId)
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
