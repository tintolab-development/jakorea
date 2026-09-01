import type { UjatInstitutionGradeClassCount } from './types'

/** 학년·반 1개 (상세 `gradeBlocks[].classes[]`·임시 배정 셀렉트 옵션과 동일 단위) */
export type UjatInstitutionGradeClassSection = {
  gradeLabel: string
  classNo: number
}

export function expandGradeClassCountsToSections(
  gradeClassCounts: ReadonlyArray<UjatInstitutionGradeClassCount>
): UjatInstitutionGradeClassSection[] {
  return gradeClassCounts.flatMap(grade =>
    Array.from({ length: grade.classCount }, (_, index) => ({
      gradeLabel: grade.gradeLabel,
      classNo: index + 1,
    }))
  )
}

export function formatGradeClassSectionLabel(section: UjatInstitutionGradeClassSection): string {
  return `${section.gradeLabel} ${section.classNo}반`
}

export function toGradeClassSectionValue(section: UjatInstitutionGradeClassSection): string {
  return `${section.gradeLabel}:${section.classNo}`
}

export function parseGradeClassSectionValue(
  value: string
): UjatInstitutionGradeClassSection | null {
  const colon = value.indexOf(':')
  if (colon <= 0) return null
  const gradeLabel = value.slice(0, colon)
  const classNo = Number.parseInt(value.slice(colon + 1), 10)
  if (!Number.isFinite(classNo) || classNo < 1) return null
  return { gradeLabel, classNo }
}
