import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionScheduleSlotKey,
} from '../list/types'
import type { UjatScheduleAssignGradeOptionValue } from './types'

export function formatScheduleAssignSchoolLabel(index: number, totalRows: number): string {
  if (totalRows <= 1) return '배정 학교'
  return `배정 학교 ${String(index + 1).padStart(2, '0')}`
}

export function buildGradeOptionsForInstitution(row: UjatInstitutionApplicationRow) {
  return row.gradeClassCounts.map(g => ({
    value: `${g.gradeLabel}:${g.classCount}` as UjatScheduleAssignGradeOptionValue,
    label: `${g.gradeLabel} ${g.classCount}학급`,
  }))
}

export function sumSelectedGradeClassCount(gradeValues: readonly UjatScheduleAssignGradeOptionValue[]): number {
  return gradeValues.reduce((sum, value) => {
    const part = value.split(':')[1]
    const n = Number.parseInt(part ?? '', 10)
    return sum + (Number.isFinite(n) ? n : 0)
  }, 0)
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
