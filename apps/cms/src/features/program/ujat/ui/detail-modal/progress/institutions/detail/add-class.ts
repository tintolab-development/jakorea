import type { EducationClassAddItem } from '@/shared/api/generated/dashboard/schemas/educationClassAddItem'
import type { EducationClassAddRequest } from '@/shared/api/generated/dashboard/schemas/educationClassAddRequest'
import type { EducationClassListResponse } from '@/shared/api/generated/dashboard/schemas/educationClassListResponse'
import type { EducationClassResponse } from '@/shared/api/generated/dashboard/schemas/educationClassResponse'
import {
  normalizeClassNameForSlot,
  normalizeGradeNumberFromLabel,
} from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/temporary-schedule-mapper'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import {
  gradeValueFromLabel,
  type UjatEducationProgressPendingClassRow,
} from './grade-blocks'

/** POST addEducationClasses item — temporary-schedule/remapping 과 동일 wire */
export function pendingRowToEducationClassAddItem(
  row: UjatEducationProgressPendingClassRow
): EducationClassAddItem {
  const grade =
    normalizeGradeNumberFromLabel(row.gradeLabel) ?? gradeValueFromLabel(row.gradeLabel)
  const className = normalizeClassNameForSlot(row.classNo) ?? `${row.classNo}반`
  return {
    grade,
    className,
    studentCount: row.studentCount,
  }
}

export function buildEducationClassAddRequest(
  pendingRows: ReadonlyArray<UjatEducationProgressPendingClassRow>,
  expectedRevision: number | null | undefined
): EducationClassAddRequest | null {
  if (pendingRows.length === 0) return null
  const body: EducationClassAddRequest = {
    classes: pendingRows.map(pendingRowToEducationClassAddItem),
  }
  if (expectedRevision != null && Number.isFinite(expectedRevision)) {
    body.expectedRevision = expectedRevision
  }
  return body
}

export function educationClassCatalogKey(
  grade: string | null | undefined,
  className: string | null | undefined
): string | null {
  const gradeWire =
    normalizeGradeNumberFromLabel(grade) ?? (grade?.replace(/학년$/, '').trim() || null)
  const classWire = normalizeClassNameForSlot(className)
  if (!gradeWire || !classWire) return null
  return `${gradeWire}:${classWire}`
}

export function isDuplicateInEducationClasses(
  classes: ReadonlyArray<EducationClassResponse>,
  gradeLabel: string,
  classNo: number
): boolean {
  const target = educationClassCatalogKey(gradeLabel, String(classNo))
  if (!target) return false
  return classes.some(item => {
    const key = educationClassCatalogKey(item.grade, item.className ?? item.classLabel)
    return key === target
  })
}

/**
 * GET/POST education-classes.classes → 신청 정보 학년 블록.
 * classes 가 비면 빈 배열 (count 필드로 행을 지어내지 않음).
 */
export function gradeBlocksFromEducationClasses(
  classes: ReadonlyArray<EducationClassResponse>
): UjatInstitutionApplicationGradeBlockDetail[] {
  const byGrade = new Map<string, Array<{ classNo: number; studentCount: number }>>()

  for (const item of classes) {
    const gradeRaw = item.grade?.trim()
    if (!gradeRaw) continue
    const gradeNum = normalizeGradeNumberFromLabel(gradeRaw) ?? gradeRaw.replace(/학년$/, '')
    if (!gradeNum) continue
    const gradeLabel = `${gradeNum}학년`
    const classWire = item.className ?? item.classLabel
    const classNoMatch = String(classWire ?? '').match(/(\d+)/)
    const classNo = classNoMatch ? Number.parseInt(classNoMatch[1]!, 10) : NaN
    if (!Number.isFinite(classNo) || classNo < 1) continue
    const studentCount =
      typeof item.studentCount === 'number' && Number.isFinite(item.studentCount)
        ? item.studentCount
        : 0
    const list = byGrade.get(gradeLabel) ?? []
    if (!list.some(row => row.classNo === classNo)) {
      list.push({ classNo, studentCount })
      byGrade.set(gradeLabel, list)
    }
  }

  return [...byGrade.entries()]
    .map(([gradeLabel, classRows]) => {
      const classesSorted = [...classRows].sort((a, b) => a.classNo - b.classNo)
      return {
        gradeLabel,
        classCount: classesSorted.length,
        classes: classesSorted,
      }
    })
    .sort((a, b) => {
      const gradeA = Number.parseInt(a.gradeLabel, 10)
      const gradeB = Number.parseInt(b.gradeLabel, 10)
      if (Number.isFinite(gradeA) && Number.isFinite(gradeB)) return gradeA - gradeB
      return a.gradeLabel.localeCompare(b.gradeLabel, 'ko')
    })
}

/**
 * 화면 집계 표시.
 * BE 불변식: classes.length === currentClassCount.
 * classes[] 가 있으면 length 만 사용 (빈 배열=0). count 로 행 invent 금지.
 */
export function resolveEducationClassCountDisplay(
  list: Pick<EducationClassListResponse, 'classes' | 'currentClassCount'> | null | undefined
): number | null {
  if (!list) return null
  const classes = list.classes
  if (Array.isArray(classes)) return classes.length
  if (typeof list.currentClassCount === 'number' && Number.isFinite(list.currentClassCount)) {
    return list.currentClassCount
  }
  return null
}
