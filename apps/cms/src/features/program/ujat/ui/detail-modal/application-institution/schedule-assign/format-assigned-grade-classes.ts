import { parseGradeClassSectionValue } from '../list/grade-class-sections'
import type { UjatInstitutionGradeClassCount } from '../list/types'
import type { UjatScheduleAssignGradeOptionValue } from './types'

function gradeSortKey(gradeLabel: string): number {
  const match = gradeLabel.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function totalClassCountForGrade(
  gradeClassCounts: ReadonlyArray<UjatInstitutionGradeClassCount>,
  gradeLabel: string
): number {
  return gradeClassCounts.find(g => g.gradeLabel === gradeLabel)?.classCount ?? 0
}

function isConsecutiveClassNos(classNos: readonly number[]): boolean {
  if (classNos.length <= 1) return classNos.length === 1
  const sorted = [...classNos].sort((a, b) => a - b)
  return sorted[sorted.length - 1] - sorted[0] + 1 === sorted.length
}

function formatPartialClassSuffix(classNos: readonly number[]): string {
  const sorted = [...classNos].sort((a, b) => a - b)
  if (isConsecutiveClassNos(sorted)) {
    if (sorted.length === 1) {
      return ` (${sorted[0]}반)`
    }
    return `(${sorted[0]}~${sorted[sorted.length - 1]}반)`
  }
  return ` (${sorted.join(', ')}반)`
}

function formatGradeLine(
  gradeLabel: string,
  classNos: readonly number[],
  totalInGrade: number
): string {
  const assignedCount = classNos.length
  if (assignedCount === 0) return ''

  if (totalInGrade > 0 && assignedCount === totalInGrade) {
    return `${gradeLabel} ${totalInGrade}학급`
  }

  const suffix = formatPartialClassSuffix(classNos)
  const spacer = suffix.startsWith(' (') ? ' ' : ''
  return `${gradeLabel} ${assignedCount}학급${spacer}${suffix}`
}

/**
 * 임시 교육 일정표 — 배정 학급 행 표기
 * - 해당 학년 전체 배정: `N학년 M학급`
 * - 일부·연속: `N학년 M학급(1~7반)`
 * - 일부·비연속: `N학년 M학급 (1, 2, 5, 6반)`
 */
export function formatAssignedGradeClassesDisplay(
  gradeValues: readonly UjatScheduleAssignGradeOptionValue[],
  gradeClassCounts: ReadonlyArray<UjatInstitutionGradeClassCount>
): string[] {
  const grouped = new Map<string, number[]>()

  for (const value of gradeValues) {
    const parsed = parseGradeClassSectionValue(value)
    if (!parsed) continue
    const list = grouped.get(parsed.gradeLabel) ?? []
    list.push(parsed.classNo)
    grouped.set(parsed.gradeLabel, list)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => gradeSortKey(a) - gradeSortKey(b))
    .map(([gradeLabel, classNos]) =>
      formatGradeLine(gradeLabel, classNos, totalClassCountForGrade(gradeClassCounts, gradeLabel))
    )
    .filter(Boolean)
}
