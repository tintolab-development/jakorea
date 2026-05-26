import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'

export type UjatEducationProgressPendingClassRow = {
  id: string
  gradeLabel: string
  classNo: number
  studentCount: number
}

export function computeTotalClassCount(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
): number {
  return gradeBlocks.reduce((sum, block) => sum + block.classCount, 0)
}

export function formatGradeLabelFromValue(gradeValue: string): string {
  return `${gradeValue}학년`
}

export function gradeValueFromLabel(gradeLabel: string): string {
  return gradeLabel.replace(/학년$/, '').trim()
}

export type UjatEducationProgressExistingClassRow = {
  id: string
  gradeLabel: string
  classNo: number
  studentCount: number
}

export function flattenExistingClasses(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
): UjatEducationProgressExistingClassRow[] {
  const rows: UjatEducationProgressExistingClassRow[] = []

  for (const block of gradeBlocks) {
    for (const cls of block.classes) {
      rows.push({
        id: `existing-${block.gradeLabel}-${cls.classNo}`,
        gradeLabel: block.gradeLabel,
        classNo: cls.classNo,
        studentCount: cls.studentCount,
      })
    }
  }

  return rows.sort((a, b) => {
    const gradeA = Number.parseInt(a.gradeLabel, 10)
    const gradeB = Number.parseInt(b.gradeLabel, 10)
    if (Number.isFinite(gradeA) && Number.isFinite(gradeB) && gradeA !== gradeB) {
      return gradeA - gradeB
    }
    if (a.classNo !== b.classNo) return a.classNo - b.classNo
    return a.gradeLabel.localeCompare(b.gradeLabel, 'ko')
  })
}

export function isDuplicateClassInGradeBlocks(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>,
  gradeLabel: string,
  classNo: number
): boolean {
  const block = gradeBlocks.find(item => item.gradeLabel === gradeLabel)
  if (!block) return false
  return block.classes.some(item => item.classNo === classNo)
}

export type UjatEducationProgressClassRemoval = {
  gradeLabel: string
  classNo: number
}

export function removeClassesFromGradeBlocks(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>,
  removals: ReadonlyArray<UjatEducationProgressClassRemoval>
): UjatInstitutionApplicationGradeBlockDetail[] {
  if (removals.length === 0) return [...gradeBlocks]

  const removalKeys = new Set(removals.map(item => `${item.gradeLabel}:${item.classNo}`))

  return gradeBlocks
    .map(block => {
      const classes = block.classes.filter(
        item => !removalKeys.has(`${block.gradeLabel}:${item.classNo}`)
      )
      return {
        ...block,
        classes,
        classCount: classes.length,
      }
    })
    .filter(block => block.classes.length > 0)
}

export function mergePendingClassesIntoGradeBlocks(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>,
  pendingRows: ReadonlyArray<UjatEducationProgressPendingClassRow>
): UjatInstitutionApplicationGradeBlockDetail[] {
  const nextBlocks = gradeBlocks.map(block => ({
    ...block,
    classes: [...block.classes],
  }))

  for (const row of pendingRows) {
    const existingBlock = nextBlocks.find(block => block.gradeLabel === row.gradeLabel)

    if (existingBlock) {
      existingBlock.classes.push({
        classNo: row.classNo,
        studentCount: row.studentCount,
      })
      existingBlock.classes.sort((a, b) => a.classNo - b.classNo)
      existingBlock.classCount = existingBlock.classes.length
      continue
    }

    nextBlocks.push({
      gradeLabel: row.gradeLabel,
      classCount: 1,
      classes: [{ classNo: row.classNo, studentCount: row.studentCount }],
    })
  }

  return nextBlocks.sort((a, b) => {
    const gradeA = Number.parseInt(a.gradeLabel, 10)
    const gradeB = Number.parseInt(b.gradeLabel, 10)
    if (Number.isFinite(gradeA) && Number.isFinite(gradeB)) return gradeA - gradeB
    return a.gradeLabel.localeCompare(b.gradeLabel, 'ko')
  })
}
