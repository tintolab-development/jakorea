import { isUjatAllocationAssignmentStatusAssigned } from '@/features/program/ujat/api/allocation-matrix-adapters'
import type { RegionAssignmentCell, RegionAssignmentTableData } from './types'

export type RegionAttendanceManagerSelectOption = {
  value: string
  label: string
}

export type RegionAttendanceManagerPut = {
  scheduleId: number
  organizationApplicationId: number
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

export const ATTENDANCE_MANAGER_UNAPPLIED_MESSAGE =
  '배정되지 않은 봉사자는 출결 담당자로 저장할 수 없습니다. 배정표를 확인한 뒤 다시 선택해 주세요.'

const ATTENDANCE_MANAGER_CLIENT_MESSAGES = new Set([
  ATTENDANCE_MANAGER_PUTS_EMPTY_MESSAGE,
  ATTENDANCE_MANAGER_UNAPPLIED_MESSAGE,
])

export function isAttendanceManagerClientError(error: unknown): boolean {
  return error instanceof Error && ATTENDANCE_MANAGER_CLIENT_MESSAGES.has(error.message)
}

function parsePositiveId(value: string | number | undefined): number | undefined {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return parsed
}

function intendedParticipantIdForAssignment(
  data: RegionAssignmentTableData,
  columnIndex: number,
  volunteerId: string | null
): number | null | undefined {
  if (volunteerId === null) return null

  const participantId = parsePositiveId(volunteerId)
  if (participantId == null) return undefined

  const row = data.rows.find(item => item.id === volunteerId)
  if (!row || row.isWithdrawnVolunteer) return undefined
  if (!isRegionAttendanceManagerCandidateCell(row.cells[columnIndex])) return undefined
  return participantId
}

export type AttendanceManagerPutIssues = {
  unappliedLabels: string[]
}

function columnLabel(
  data: RegionAssignmentTableData,
  columnId: string,
  columnIndex: number
): string {
  const column = columnIndex >= 0 ? data.columns[columnIndex] : undefined
  if (!column) return columnId
  return formatAttendanceManagerScheduleLabel(
    column.isoDate,
    column.dateLabel,
    column.institutionName
  )
}

/** 저장할 수 없는 선택. PUT 전에 막는다. 같은 날짜 다른 기관 열은 서로 다른 PUT. */
export function getAttendanceManagerPutIssues(
  data: RegionAssignmentTableData,
  assignments: RegionAttendanceManagerAssignments
): AttendanceManagerPutIssues {
  const unappliedLabels: string[] = []

  for (const [columnId, volunteerId] of Object.entries(assignments)) {
    const columnIndex = data.columns.findIndex(column => column.id === columnId)
    const label = columnLabel(data, columnId, columnIndex)
    const column = columnIndex >= 0 ? data.columns[columnIndex] : undefined

    if (!column) {
      unappliedLabels.push(label)
      continue
    }

    const scheduleId = parsePositiveId(column.scheduleId)
    const organizationApplicationId = parsePositiveId(column.organizationApplicationId)
    if (scheduleId == null || organizationApplicationId == null) {
      unappliedLabels.push(label)
      continue
    }

    const intended = intendedParticipantIdForAssignment(data, columnIndex, volunteerId)
    if (intended === undefined) {
      unappliedLabels.push(label)
    }
  }

  return { unappliedLabels }
}

/**
 * 출결 담당 PUT 목록. 열(scheduleId + organizationApplicationId)당 1건.
 * ASSIGNED가 아닌 행·0·비유한 participantId·기관 id는 보내지 않는다.
 * 뱃지는 PUT 응답/로컬 overlay가 아니라 GET allocation-matrix cells.attendanceManager 만 쓴다.
 */
export function collectAttendanceManagerPuts(
  data: RegionAssignmentTableData,
  assignments: RegionAttendanceManagerAssignments
): RegionAttendanceManagerPut[] {
  const byColumnKey = new Map<string, RegionAttendanceManagerPut>()

  for (const [columnId, volunteerId] of Object.entries(assignments)) {
    const columnIndex = data.columns.findIndex(column => column.id === columnId)
    if (columnIndex < 0) continue

    const column = data.columns[columnIndex]
    const scheduleId = parsePositiveId(column?.scheduleId)
    const organizationApplicationId = parsePositiveId(column?.organizationApplicationId)
    if (scheduleId == null || organizationApplicationId == null) continue

    const intended = intendedParticipantIdForAssignment(data, columnIndex, volunteerId)
    if (intended === undefined) continue

    byColumnKey.set(`${scheduleId}:${organizationApplicationId}`, {
      scheduleId,
      organizationApplicationId,
      participantId: intended,
    })
  }

  return [...byColumnKey.values()]
}

/** 검증 통과 시에만 PUT 목록. 실패면 사용자 메시지 Error. */
export function resolveAttendanceManagerPuts(
  data: RegionAssignmentTableData,
  assignments: RegionAttendanceManagerAssignments
): RegionAttendanceManagerPut[] {
  const issues = getAttendanceManagerPutIssues(data, assignments)
  if (issues.unappliedLabels.length > 0) {
    throw new Error(ATTENDANCE_MANAGER_UNAPPLIED_MESSAGE)
  }
  const puts = collectAttendanceManagerPuts(data, assignments)
  if (puts.length === 0) {
    throw new Error(ATTENDANCE_MANAGER_PUTS_EMPTY_MESSAGE)
  }
  return puts
}
