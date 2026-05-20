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

export function listTempAssignedSchoolsForDate(
  rows: UjatInstitutionApplicationRow[],
  regionKey: UjatInstitutionApplicationRow['regionKey'],
  isoDate: string
): UjatInstitutionApplicationRow[] {
  return rows.filter(
    row =>
      row.regionKey === regionKey &&
      row.tempAssignmentStatus === 'temp_assigned' &&
      row.scheduleSlots[isoDate as UjatInstitutionScheduleSlotKey] === 'O'
  )
}

export function computeVolunteerEducationDays(
  expectedClassCount: number,
  expectedVolunteerCount: number
): number | null {
  if (expectedVolunteerCount <= 0 || expectedClassCount <= 0) return null
  return Math.round((expectedClassCount * 2) / expectedVolunteerCount)
}
