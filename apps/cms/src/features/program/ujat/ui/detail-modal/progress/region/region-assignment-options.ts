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

export const REGION_DIRECT_ASSIGN_SECONDARY_LABEL = '두 번째 봉사자 배정'

/** 학급 슬롯 배정 인원 — 재배정 필요 건은 미배정으로 본다 */
function countRegionClassSlotAssignees(
  classLabel: string,
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number
): number {
  return rows.filter(row => {
    const cell = row.cells[columnIndex]
    return (
      cell?.kind === 'assigned' &&
      !cell.isInvalidAssignment &&
      cell.classLabel === classLabel
    )
  }).length
}

export function getRegionAssignmentTableData(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  return getRegionAssignmentTableDataFromStore(half, regionKey)
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
 * 대체 배정 검사 대상 열 — 같은 날 판정은 서울 날짜 기준이라 선택 날짜의 모든 일정 열을 본다.
 */
function getBlockedDateSubstituteColumnIndices(
  columns: RegionAssignmentColumn[],
  dateLabels: string[]
): number[] {
  return columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => dateLabels.includes(column.dateLabel))
    .map(({ index }) => index)
}

/** 같은 날 어느 일정에도 배정되지 않았고, 그 날 활동 불가도 아닌 봉사자 */
function isVolunteerFreeOnColumnIndices(
  row: RegionAssignmentVolunteerRow,
  columnIndices: number[]
): boolean {
  return columnIndices.every(index => {
    const cell = row.cells[index]
    if (cell?.kind === 'empty' && cell.blockedEmpty) return false
    return isVolunteerUnassignedOnColumn(row, index)
  })
}

/**
 * 직접 배정 학급 옵션 — 빈 슬롯·1인 슬롯(두 번째 봉사자 배정)은 선택 가능, 2인이 찬 슬롯만 비활성.
 */
export function getRegionDirectAssignClassOptionsFromData(
  data: RegionAssignmentTableData
): { value: string; label: string; disabled?: boolean }[] {
  const { columns, rows } = data

  return columns.flatMap((column, columnIndex) =>
    column.classSlots.map(slot => {
      const label = formatRegionDirectAssignClassOptionLabel(
        column.dateLabel,
        formatUjatGradeClassDisplayLabel(slot.classLabel),
        column.institutionName
      )
      const assignees = countRegionClassSlotAssignees(slot.classLabel, rows, columnIndex)
      if (assignees >= 2) {
        return { value: slot.id, label: `${label} · 배정 완료`, disabled: true }
      }
      if (assignees === 1) {
        return { value: slot.id, label: `${label} · ${REGION_DIRECT_ASSIGN_SECONDARY_LABEL}` }
      }
      return { value: slot.id, label }
    })
  )
}

export function getRegionDirectAssignClassOptions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string; disabled?: boolean }[] {
  return getRegionDirectAssignClassOptionsFromData(getRegionAssignmentTableData(half, regionKey))
}

/**
 * 직접 배정 후보(GET direct-assignment-candidates) → 봉사자 옵션. 서버 순서를 유지한다.
 * 빈 슬롯의 2인조 이동 후보(sourceAssignmentGroupId)는 이동 출처 학급을 함께 표기한다.
 */
export function mapRegionDirectAssignCandidateOptions(
  response: UjatDirectAssignmentCandidatesResponse | null | undefined
): { value: string; label: string }[] {
  return (response?.candidates ?? []).flatMap(candidate => {
    if (candidate.participantId == null) return []
    const name = candidate.volunteerName?.trim() || `봉사자 ${candidate.participantId}`
    const sourceClass = formatUjatGradeClassDisplayLabel(candidate.sourceClassLabel)
    const label =
      candidate.sourceAssignmentGroupId != null
        ? `${name} (${sourceClass === '-' ? '기존' : sourceClass} 2인조에서 이동)`
        : name
    return [{ value: String(candidate.participantId), label }]
  })
}

/**
 * 참여 불가일 POST 대상 scheduleId — 활동 불가는 서울 날짜 단위로 적용되므로 날짜당 1건.
 * 대상 봉사자가 그 날 배정된 일정이 있으면 그 일정(대체자가 해당 배정을 넘겨받음), 없으면 그 날 첫 일정.
 */
export function selectRegionUnavailabilityScheduleIds(
  data: RegionAssignmentTableData,
  volunteerId: string,
  dateLabels: readonly string[]
): string[] {
  const target = data.rows.find(row => row.id === volunteerId)
  const byDate = new Map<string, { assigned?: string; first?: string }>()

  data.columns.forEach((column, index) => {
    if (!column.scheduleId || !dateLabels.includes(column.dateLabel)) return
    const dateKey = column.isoDate || column.dateLabel
    const entry = byDate.get(dateKey) ?? {}
    entry.first ??= column.scheduleId
    if (!entry.assigned && target?.cells[index]?.kind === 'assigned') {
      entry.assigned = column.scheduleId
    }
    byDate.set(dateKey, entry)
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
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string }[] {
  return getRegionBlockedDateVolunteerOptionsFromData(
    getRegionAssignmentTableData(half, regionKey)
  )
}

/** 참여 불가일 설정 — 지역 내 모든 교육일(중복 일자 제거, 열 순서 유지) */
export function getRegionEducationDateOptionsFromData(
  data: RegionAssignmentTableData
): { value: string; label: string }[] {
  const seen = new Set<string>()

  return data.columns.reduce<{ value: string; label: string }[]>((acc, column) => {
    if (seen.has(column.dateLabel)) return acc
    seen.add(column.dateLabel)
    acc.push({ value: column.dateLabel, label: column.dateLabel })
    return acc
  }, [])
}

export function getRegionEducationDateOptions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): { value: string; label: string }[] {
  return getRegionEducationDateOptionsFromData(getRegionAssignmentTableData(half, regionKey))
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

  return rows
    .filter(
      row =>
        row.id !== targetVolunteerId &&
        !row.isWithdrawnVolunteer &&
        isVolunteerFreeOnColumnIndices(row, columnIndices)
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
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey,
  targetVolunteerId: string,
  blockedDateLabels: string[]
): { value: string; label: string }[] {
  return getRegionBlockedDateSubstituteVolunteerOptionsFromData(
    getRegionAssignmentTableData(half, regionKey),
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
