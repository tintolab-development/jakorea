import {
  expandGradeClassCountsToSections,
  formatGradeClassSectionLabel,
  toGradeClassSectionValue,
} from '../list/grade-class-sections'
import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionScheduleSlotKey,
} from '../list/types'
import type { UjatScheduleAssignGradeOptionValue } from './types'

export function formatScheduleAssignSchoolLabel(index: number, totalRows: number): string {
  if (totalRows <= 1) return '배정 학교'
  return `배정 학교 ${String(index + 1).padStart(2, '0')}`
}

/** 선택 학교의 학년·반 목록 — 상세 「학년 별 신청 정보」와 동일 단위 */
export function buildGradeOptionsForInstitution(row: UjatInstitutionApplicationRow) {
  return expandGradeClassCountsToSections(row.gradeClassCounts).map(section => ({
    value: toGradeClassSectionValue(section) as UjatScheduleAssignGradeOptionValue,
    label: formatGradeClassSectionLabel(section),
  }))
}

/** 선택된 학년·반 개수 (= 총 배정 학급 수) */
export function sumSelectedGradeClassCount(gradeValues: readonly UjatScheduleAssignGradeOptionValue[]): number {
  return gradeValues.length
}

const BLOCKED_ASSIGN_STATUSES = new Set<UjatInstitutionApplicationRow['tempAssignmentStatus']>([
  'temp_rejected',
  'application_rejected',
])

/** 신청 반려·임시 반려 기관 — 신규 배정 불가, 기존 배정 행은 비활성으로만 노출 */
export function isScheduleAssignBlockedInstitution(
  row: Pick<UjatInstitutionApplicationRow, 'tempAssignmentStatus'>
): boolean {
  return BLOCKED_ASSIGN_STATUSES.has(row.tempAssignmentStatus)
}

export function collectScheduleAssignPendingInstitutionNames(
  days: Record<
    string,
    { rows: Array<{ institutionRowId?: string | null; gradeValues: readonly string[] }> }
  >,
  namesById: Record<string, string>
): string[] {
  const ids: string[] = []
  const seen = new Set<string>()
  for (const day of Object.values(days)) {
    for (const row of day.rows) {
      const id = row.institutionRowId?.trim()
      if (!id || row.gradeValues.length === 0 || seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
  }
  return ids.map(id => namesById[id]?.trim() || id)
}

/**
 * 해당 날짜에 배정 가능한 기관.
 * 목록 일괄 「임시 배정」은 상태 PATCH를 하지 않으므로 SUBMITTED(평가 대기)도 포함한다.
 * 해당 일 희망일(O)이 있는 기관만.
 */
export function listAssignableSchoolsForDate(
  rows: UjatInstitutionApplicationRow[],
  regionKey: UjatInstitutionApplicationRow['regionKey'],
  isoDate: string
): UjatInstitutionApplicationRow[] {
  return rows.filter(
    row =>
      row.regionKey === regionKey &&
      !isScheduleAssignBlockedInstitution(row) &&
      row.scheduleSlots[isoDate as UjatInstitutionScheduleSlotKey] === 'O'
  )
}

/** @deprecated listAssignableSchoolsForDate */
export function listTempAssignedSchoolsForDate(
  rows: UjatInstitutionApplicationRow[],
  regionKey: UjatInstitutionApplicationRow['regionKey'],
  isoDate: string
): UjatInstitutionApplicationRow[] {
  return listAssignableSchoolsForDate(rows, regionKey, isoDate)
}

/**
 * BE `UjatRegionCapacityService.planningEstimates` 와 동일:
 * volunteers <= 0 → null, else (totalClassCount * 2.0) / volunteers (반올림 없음).
 * 필수 입력(1일 최대 학급 수·봉사단 수) 미기입 시에도 계산하지 않는다.
 */
export function computeVolunteerEducationDays(
  expectedClassCount: number,
  expectedVolunteerCount: number,
  requiredInputsEntered = true
): number | null {
  if (!requiredInputsEntered) return null
  if (!Number.isFinite(expectedVolunteerCount) || !Number.isFinite(expectedClassCount)) return null
  if (expectedVolunteerCount <= 0) return null
  return (expectedClassCount * 2) / expectedVolunteerCount
}

/** 양수 소수점이 0으로 오인되지 않도록 표시. 부동소수 노이즈만 정리. */
export function formatVolunteerEducationDays(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-'
  if (value === 0) return '0'
  const normalized = Math.round(value * 1e10) / 1e10
  if (Number.isInteger(normalized)) return String(normalized)
  return String(normalized)
}

export function isScheduleAssignEstimationInputsEntered(
  maxClassesPerDay: string,
  expectedVolunteerCount: string
): boolean {
  return maxClassesPerDay.trim() !== '' && expectedVolunteerCount.trim() !== ''
}
