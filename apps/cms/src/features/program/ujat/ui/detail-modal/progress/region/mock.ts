import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { formatRegionAssignmentInstitutionLabel } from './format-institution-label'
import { getRegionAssignmentTableDataFromStore } from './region-assignment-store'
import type {
  RegionAssignmentColumn,
  RegionAssignmentTableData,
  RegionAssignmentVolunteerRow,
} from './types'

export { buildInitialRegionAssignmentTableData } from './mock-data'

function formatRegionDirectAssignClassOptionLabel(
  dateLabel: string,
  classLabel: string,
  institutionName: string
): string {
  return `${dateLabel} ｜ ${classLabel} (${institutionName})`
}

function isRegionClassSlotUnassigned(
  column: RegionAssignmentColumn,
  classLabel: string,
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number
): boolean {
  /** 배정 불가일에 배정된 건도 미배정으로 간주 */
  if (column.isBlockedDate) return true

  const assignedCount = rows.filter(row => {
    const cell = row.cells[columnIndex]
    return (
      cell?.kind === 'assigned' &&
      !cell.isInvalidAssignment &&
      cell.classLabel === classLabel
    )
  }).length

  return assignedCount < 2
}

export function getRegionAssignmentTableData(
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  return getRegionAssignmentTableDataFromStore(regionKey)
}

function findRegionAssignmentColumnIndexByClassSlotId(
  columns: RegionAssignmentColumn[],
  classSlotId: string
): number {
  return columns.findIndex(column => column.classSlots.some(slot => slot.id === classSlotId))
}

function isVolunteerUnassignedOnColumn(
  row: RegionAssignmentVolunteerRow,
  columnIndex: number
): boolean {
  const cell = row.cells[columnIndex]
  return cell?.kind !== 'assigned' || cell.isInvalidAssignment === true
}

function countVolunteerAssignedDays(row: RegionAssignmentVolunteerRow): number {
  return row.cells.filter(cell => cell.kind === 'assigned').length
}

/**
 * 대체 배정 검사 대상 열.
 * - 대상 봉사자가 선택한 날짜에 배정된 열이 있으면 그 열만 검사
 * - 없으면 해당 날짜의 모든 기관 열 검사
 */
function getBlockedDateSubstituteColumnIndices(
  columns: RegionAssignmentColumn[],
  rows: RegionAssignmentVolunteerRow[],
  targetVolunteerId: string,
  dateLabels: string[]
): number[] {
  const target = rows.find(row => row.id === targetVolunteerId)
  if (!target) return []

  const targetAssignedIndices = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column, index }) => {
      if (!dateLabels.includes(column.dateLabel)) return false
      const cell = target.cells[index]
      return cell?.kind === 'assigned'
    })
    .map(({ index }) => index)

  if (targetAssignedIndices.length > 0) return targetAssignedIndices

  return columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => dateLabels.includes(column.dateLabel))
    .map(({ index }) => index)
}

function isVolunteerUnassignedOnColumnIndices(
  row: RegionAssignmentVolunteerRow,
  columnIndices: number[]
): boolean {
  if (columnIndices.length === 0) return true
  return columnIndices.every(index => isVolunteerUnassignedOnColumn(row, index))
}

export function getRegionDirectAssignClassOptions(
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string }[] {
  const { columns, rows } = getRegionAssignmentTableData(regionKey)

  return columns.flatMap((column, columnIndex) =>
    column.classSlots
      .filter(slot =>
        isRegionClassSlotUnassigned(column, slot.classLabel, rows, columnIndex)
      )
      .map(slot => ({
        value: slot.id,
        label: formatRegionDirectAssignClassOptionLabel(
          column.dateLabel,
          slot.classLabel,
          column.institutionName
        ),
      }))
  )
}

/** 선택한 교육 학급(일정·기관)에 미배정된 봉사자 — 총 배정일 수 오름차순 */
export function getRegionDirectAssignVolunteerOptions(
  regionKey: UjatInstitutionApplicationRegionKey,
  classSlotId: string
): { value: string; label: string }[] {
  const { columns, rows } = getRegionAssignmentTableData(regionKey)
  const columnIndex = findRegionAssignmentColumnIndexByClassSlotId(columns, classSlotId)
  if (columnIndex < 0) return []

  return rows
    .filter(
      row =>
        !row.isWithdrawnVolunteer &&
        isVolunteerUnassignedOnColumn(row, columnIndex)
    )
    .sort((a, b) => a.totalAssignedDays - b.totalAssignedDays)
    .map(row => ({
      value: row.id,
      label: row.name,
    }))
}

/** 배정 불가일 설정 — 봉사자명 옵션 */
export function getRegionBlockedDateVolunteerOptions(
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string }[] {
  const { rows } = getRegionAssignmentTableData(regionKey)

  return rows
    .filter(row => !row.isWithdrawnVolunteer)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    .map(row => ({
      value: row.id,
      label: row.name,
    }))
}

/** 배정 불가일 설정 — 지역 내 모든 교육일(중복 일자 제거, 열 순서 유지) */
export function getRegionEducationDateOptions(
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string }[] {
  const { columns } = getRegionAssignmentTableData(regionKey)
  const seen = new Set<string>()

  return columns.reduce<{ value: string; label: string }[]>((acc, column) => {
    if (seen.has(column.dateLabel)) return acc
    seen.add(column.dateLabel)
    acc.push({ value: column.dateLabel, label: column.dateLabel })
    return acc
  }, [])
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
  const columnIndices = getBlockedDateSubstituteColumnIndices(
    columns,
    rows,
    targetVolunteerId,
    uniqueDateLabels
  )

  return rows
    .filter(
      row =>
        row.id !== targetVolunteerId &&
        !row.isWithdrawnVolunteer &&
        isVolunteerUnassignedOnColumnIndices(row, columnIndices)
    )
    .sort(
      (a, b) => countVolunteerAssignedDays(a) - countVolunteerAssignedDays(b)
    )
    .map(row => ({
      value: row.id,
      label: row.name,
    }))
}

export function getRegionBlockedDateSubstituteVolunteerOptions(
  regionKey: UjatInstitutionApplicationRegionKey,
  targetVolunteerId: string,
  blockedDateLabels: string[]
): { value: string; label: string }[] {
  return getRegionBlockedDateSubstituteVolunteerOptionsFromData(
    getRegionAssignmentTableData(regionKey),
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
