import { isUjatAllocationAssignmentStatusAssigned } from '@/features/program/ujat/api/allocation-matrix-adapters'
import type { UjatDirectAssignmentCandidatesResponse } from '@/features/program/ujat/api/education-execution-api'
import { formatUjatGradeClassDisplayLabel } from '@/features/program/ujat/lib/ujat-grade-class-display'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import { formatRegionAssignmentInstitutionLabel } from './format-institution-label'
import { getRegionAssignmentTableDataFromStore } from './region-assignment-store'
import type {
  RegionAssignmentColumn,
  RegionAssignmentTableData,
  RegionAssignmentVolunteerRow,
} from './types'

function formatRegionDirectAssignClassOptionLabel(
  dateLabel: string,
  classLabel: string,
  institutionName: string
): string {
  return `${dateLabel} ｜ ${classLabel} (${institutionName})`
}

/**
 * 후보/직접배정 API와 동일: start_at IS NULL OR start_at > now().
 * 표시용 달력일 문자열·UTC slice 비교 금지. Instant만 Date.parse.
 */
export function isRegionDirectAssignEducationNotStarted(
  educationStartAt: string | null | undefined,
  nowMs = Date.now()
): boolean {
  const start = educationStartAt == null ? null : Date.parse(educationStartAt)
  return start == null || start > nowMs
}

/**
 * 학급 슬롯 점유 — GET assignedVolunteerCount와 동일.
 * assignmentStatus === ASSIGNED ∩ 같은 educationSlotId ∩ giveUp 아님. participantId distinct.
 * REASSIGNMENT_REQUIRED / UNASSIGNED / 다른 학급 슬롯은 넣지 않는다.
 */
function countRegionClassSlotAssignees(
  educationSlotId: string,
  rows: RegionAssignmentVolunteerRow[]
): number {
  const assigneeIds = new Set<string>()
  for (const row of rows) {
    if (row.isWithdrawnVolunteer) continue
    const assignedHere = row.cells.some(
      cell =>
        cell.kind === 'assigned' &&
        cell.educationSlotId === educationSlotId &&
        (cell.assignmentStatus ?? '').trim().toUpperCase() === 'ASSIGNED'
    )
    if (assignedHere) assigneeIds.add(row.id)
  }
  return assigneeIds.size
}

export function getRegionAssignmentTableData(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  return getRegionAssignmentTableDataFromStore(programId, half, regionKey)
}

function isVolunteerUnassignedOnColumn(
  row: RegionAssignmentVolunteerRow,
  columnIndex: number
): boolean {
  const cell = row.cells[columnIndex]
  return cell?.kind !== 'assigned' || cell.isInvalidAssignment === true
}

/** 반기 matrix 응답의 totalAssignedDays SSOT — cells를 다시 세어 보정하지 않는다 */
function volunteerAssignedDays(row: RegionAssignmentVolunteerRow): number {
  return row.totalAssignedDays
}

/** columns=[]여도 volunteers 행 수를 숨기지 않는다 */
export function getRegionAssignmentDisplayedVolunteerCount(
  table: Pick<RegionAssignmentTableData, 'volunteerCount'>
): number {
  return table.volunteerCount
}

/** 매트릭스 int. null이면 0일 */
export function formatRegionAssignmentTotalAssignedDays(
  totalAssignedDays: number | null | undefined
): string {
  return `${totalAssignedDays ?? 0}일`
}

/** allocation-matrix `isoDate`(educationStartAt → Asia/Seoul YYYY-MM-DD). UTC slice 금지. */
function seoulCalendarDay(column: RegionAssignmentColumn): string | null {
  const ymd = column.isoDate?.trim()
  return ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null
}

function isAssignedMatrixCell(
  cell: RegionAssignmentVolunteerRow['cells'][number] | undefined
): boolean {
  return (
    cell?.kind === 'assigned' &&
    cell.isInvalidAssignment !== true &&
    isUjatAllocationAssignmentStatusAssigned(cell.assignmentStatus)
  )
}

function isUnavailableMatrixCell(
  cell: RegionAssignmentVolunteerRow['cells'][number] | undefined
): boolean {
  return cell?.kind === 'empty' && cell.blockedEmpty === true
}

/** 대체 후보: 그 열 UNASSIGNED (REASSIGNMENT_REQUIRED·ASSIGNED·unavailable 제외) */
function isUnassignedAvailableOnColumn(
  row: RegionAssignmentVolunteerRow,
  columnIndex: number
): boolean {
  const cell = row.cells[columnIndex]
  if (isUnavailableMatrixCell(cell)) return false
  if (cell?.kind === 'assigned') return false
  return isVolunteerUnassignedOnColumn(row, columnIndex)
}

/**
 * 대체 배정 검사 대상 열 — 같은 서울 달력일의 모든 일정 열.
 */
function getBlockedDateSubstituteColumnIndices(
  columns: RegionAssignmentColumn[],
  seoulDays: string[]
): number[] {
  const daySet = new Set(seoulDays)
  return columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => {
      const day = seoulCalendarDay(column)
      return day != null && daySet.has(day)
    })
    .map(({ index }) => index)
}

/** 같은 서울일에 어느 일정에도 ASSIGNED가 없고, 그날 활동 불가도 아닌 봉사자 */
function isVolunteerFreeOnColumnIndices(
  row: RegionAssignmentVolunteerRow,
  columnIndices: number[]
): boolean {
  if (columnIndices.length === 0) return false
  return columnIndices.every(index => isUnassignedAvailableOnColumn(row, index))
}

/**
 * 직접 배정 학급 옵션.
 * 만석·지난 교육일·임시 슬롯은 목록에 넣지 않는다. 미래·미만석만 선택 가능.
 */
export function getRegionDirectAssignClassOptionsFromData(
  data: RegionAssignmentTableData,
  nowMs = Date.now()
): { value: string; label: string; disabled?: boolean }[] {
  const { columns, rows } = data

  return columns.flatMap(column =>
    column.classSlots.flatMap(slot => {
      if (slot.isEducationSlotId === false) return []
      if (countRegionClassSlotAssignees(slot.id, rows) >= 2) return []
      if (!isRegionDirectAssignEducationNotStarted(column.educationStartAt, nowMs)) return []
      return [
        {
          value: slot.id,
          label: formatRegionDirectAssignClassOptionLabel(
            column.dateLabel,
            formatUjatGradeClassDisplayLabel(slot.classLabel),
            column.institutionName
          ),
        },
      ]
    })
  )
}

export function isRegionDirectAssignClassSlotSelectable(
  data: RegionAssignmentTableData,
  classSlotId: string | undefined,
  nowMs = Date.now()
): boolean {
  if (!classSlotId) return false
  return getRegionDirectAssignClassOptionsFromData(data, nowMs).some(
    option => option.value === classSlotId && option.disabled !== true
  )
}

export function isRegionDirectAssignClassSlotFull(
  data: RegionAssignmentTableData,
  classSlotId: string | undefined
): boolean {
  if (!classSlotId) return false
  return countRegionClassSlotAssignees(classSlotId, data.rows) >= 2
}

export function getRegionDirectAssignClassOptions(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string; disabled?: boolean }[] {
  return getRegionDirectAssignClassOptionsFromData(
    getRegionAssignmentTableData(programId, half, regionKey)
  )
}

/**
 * 직접 배정 후보(GET direct-assignment-candidates) → 봉사자 옵션. 서버 순서를 유지한다.
 * 빈 슬롯의 2인조 이동 후보(sourceAssignmentGroupId)는 이동 출처 학급을 함께 표기한다.
 */
export function mapRegionDirectAssignCandidateOptions(
  response: UjatDirectAssignmentCandidatesResponse | null | undefined
): { value: string; label: string }[] {
  const existingPrimaryId = response?.existingPrimaryParticipantId
  return (response?.candidates ?? []).flatMap(candidate => {
    if (candidate.participantId == null) return []
    if (existingPrimaryId != null && candidate.participantId === existingPrimaryId) return []
    const name = candidate.volunteerName?.trim() || '-'
    const sourceClass = formatUjatGradeClassDisplayLabel(candidate.sourceClassLabel)
    const label =
      candidate.sourceAssignmentGroupId != null
        ? `${name} (${sourceClass === '-' ? '기존' : sourceClass} 2인조에서 이동)`
        : name
    return [{ value: String(candidate.participantId), label }]
  })
}

function getColumnIndicesForSeoulDays(
  columns: RegionAssignmentColumn[],
  seoulDays: readonly string[]
): number[] {
  const daySet = new Set(seoulDays)
  return columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => {
      const day = seoulCalendarDay(column)
      return day != null && daySet.has(day)
    })
    .map(({ index }) => index)
}

/**
 * 선택한 서울 달력일에 **활성 배정(ASSIGNED)** 이 있는지.
 * REASSIGNMENT_REQUIRED / UNASSIGNED / unavailable 만 있으면 false (대체 없이 불가 등록).
 */
export function regionUnavailabilityRequiresReplacementForDate(
  data: RegionAssignmentTableData,
  volunteerId: string,
  seoulDay: string
): boolean {
  const row = data.rows.find(item => item.id === volunteerId)
  if (!row) return false
  const indices = getColumnIndicesForSeoulDays(data.columns, [seoulDay])
  return indices.some(index => isAssignedMatrixCell(row.cells[index]))
}

/** 선택한 불가일 중 하나라도 활성 배정이 있으면 대체 봉사자 필수 */
export function regionUnavailabilityRequiresReplacement(
  data: RegionAssignmentTableData,
  volunteerId: string,
  seoulDays: readonly string[]
): boolean {
  const unique = [...new Set(seoulDays)]
  return unique.some(day => regionUnavailabilityRequiresReplacementForDate(data, volunteerId, day))
}

/**
 * 참여 불가일 POST 대상 scheduleId — 활동 불가는 서울 날짜 단위로 적용되므로 날짜당 1건.
 * 대상 봉사자가 그 날 ASSIGNED 일정이 있으면 그 일정, 없으면 그 날 첫 일정.
 */
export function selectRegionUnavailabilityScheduleIds(
  data: RegionAssignmentTableData,
  volunteerId: string,
  seoulDays: readonly string[]
): string[] {
  const target = data.rows.find(row => row.id === volunteerId)
  const daySet = new Set(seoulDays)
  const byDate = new Map<string, { assigned?: string; first?: string }>()

  data.columns.forEach((column, index) => {
    const day = seoulCalendarDay(column)
    if (!column.scheduleId || day == null || !daySet.has(day)) return
    const entry = byDate.get(day) ?? {}
    entry.first ??= column.scheduleId
    if (!entry.assigned && isAssignedMatrixCell(target?.cells[index])) {
      entry.assigned = column.scheduleId
    }
    byDate.set(day, entry)
  })

  return [...byDate.values()].flatMap(entry => {
    const scheduleId = entry.assigned ?? entry.first
    return scheduleId ? [scheduleId] : []
  })
}

/** 참여 불가일 설정 — 봉사자명 옵션 */
export function getRegionBlockedDateVolunteerOptionsFromData(
  data: RegionAssignmentTableData
): { value: string; label: string }[] {
  return data.rows
    .filter(row => !row.isWithdrawnVolunteer)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    .map(row => ({
      value: row.id,
      label: row.name,
    }))
}

export function getRegionBlockedDateVolunteerOptions(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string }[] {
  return getRegionBlockedDateVolunteerOptionsFromData(
    getRegionAssignmentTableData(programId, half, regionKey)
  )
}

/** 참여 불가일 설정 — 지역 내 모든 교육일(서울 달력일 distinct, 열 순서 유지) */
export function getRegionEducationDateOptionsFromData(
  data: RegionAssignmentTableData
): { value: string; label: string }[] {
  const seen = new Set<string>()

  return data.columns.reduce<{ value: string; label: string }[]>((acc, column) => {
    const value = seoulCalendarDay(column)
    if (!value || seen.has(value)) return acc
    seen.add(value)
    const label = column.dateLabel.trim() && column.dateLabel !== '-' ? column.dateLabel : value
    acc.push({ value, label })
    return acc
  }, [])
}

/** 참여 불가일 설정 — 해당 봉사자에게 활성 배정이 있는 교육일만 */
export function getRegionAssignedEducationDateOptionsFromData(
  data: RegionAssignmentTableData,
  volunteerId: string
): { value: string; label: string }[] {
  return getRegionEducationDateOptionsFromData(data).filter(option =>
    regionUnavailabilityRequiresReplacementForDate(data, volunteerId, option.value)
  )
}

export function getRegionEducationDateOptions(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string }[] {
  return getRegionEducationDateOptionsFromData(
    getRegionAssignmentTableData(programId, half, regionKey)
  )
}

/** 선택한 교육일(진행일)에 배정이 없는 대체 봉사자 — 배정일 수 오름차순 */
export function getRegionBlockedDateSubstituteVolunteerOptionsFromData(
  data: RegionAssignmentTableData,
  targetVolunteerId: string,
  blockedDateLabels: string[]
): { value: string; label: string }[] {
  const { columns, rows } = data
  if (blockedDateLabels.length === 0) return []

  const uniqueDateLabels = [...new Set(blockedDateLabels)]
  const columnIndices = getBlockedDateSubstituteColumnIndices(columns, uniqueDateLabels)
  if (columnIndices.length === 0) return []

  return rows
    .filter(
      row =>
        row.id !== targetVolunteerId &&
        !row.isWithdrawnVolunteer &&
        isVolunteerFreeOnColumnIndices(row, columnIndices)
    )
    .sort((a, b) => volunteerAssignedDays(a) - volunteerAssignedDays(b))
    .map(row => ({
      value: row.id,
      label: row.name,
    }))
}

export function getRegionBlockedDateSubstituteVolunteerOptions(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey,
  targetVolunteerId: string,
  blockedDateLabels: string[]
): { value: string; label: string }[] {
  return getRegionBlockedDateSubstituteVolunteerOptionsFromData(
    getRegionAssignmentTableData(programId, half, regionKey),
    targetVolunteerId,
    blockedDateLabels
  )
}

export function getRegionAssignmentInstitutionHeaderLabel(
  column: RegionAssignmentColumn,
  regionKey: UjatInstitutionApplicationRegionKey
): string {
  return formatRegionAssignmentInstitutionLabel(
    column.institutionName,
    column.location,
    regionKey
  )
}
