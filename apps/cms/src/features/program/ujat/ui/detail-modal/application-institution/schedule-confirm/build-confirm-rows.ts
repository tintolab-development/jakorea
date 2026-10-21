import { formatScheduleColumnTitle } from '../education-schedule'
import { parseGradeClassSectionValue } from '../list/grade-class-sections'
import type { UjatInstitutionApplicationRow } from '../list/types'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { getUjatScheduleAssignRegionState } from '../schedule-assign/store'
import {
  UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS,
  type UjatScheduleConfirmRow,
} from './types'

function emptyGradeCounts(): UjatScheduleConfirmRow['assignedGradeCounts'] {
  return Object.fromEntries(
    UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS.map(label => [label, 0])
  ) as UjatScheduleConfirmRow['assignedGradeCounts']
}

function buildFromScheduleAssignStore(
  institutionId: string,
  regionKey: UjatInstitutionApplicationRegionKey
): {
  confirmedScheduleIsoDates: string[]
  confirmedScheduleDisplay: string
  assignedGradeCounts: UjatScheduleConfirmRow['assignedGradeCounts']
  totalEducationClassCount: number
  hasStoreAssignment: boolean
} {
  const state = getUjatScheduleAssignRegionState(regionKey)
  const assignedGradeCounts = emptyGradeCounts()
  const confirmedTitles: string[] = []
  const confirmedIsoDates: string[] = []
  let totalEducationClassCount = 0
  let hasStoreAssignment = false

  for (const isoDate of Object.keys(state.days).sort()) {
    const title = formatScheduleColumnTitle(isoDate)
    const day = state.days[isoDate]
    if (!day) continue
    let dayHasInstitution = false
    for (const row of day.rows) {
      if (row.institutionRowId !== institutionId) continue
      if (row.gradeValues.length === 0) continue
      hasStoreAssignment = true
      dayHasInstitution = true
      for (const value of row.gradeValues) {
        const parsed = parseGradeClassSectionValue(value)
        if (!parsed) continue
        const label = parsed.gradeLabel as (typeof UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS)[number]
        if (!(label in assignedGradeCounts)) continue
        assignedGradeCounts[label] += 1
        totalEducationClassCount += 1
      }
    }
    if (dayHasInstitution) {
      confirmedIsoDates.push(isoDate)
      confirmedTitles.push(title)
    }
  }

  return {
    confirmedScheduleIsoDates: confirmedIsoDates,
    confirmedScheduleDisplay: confirmedTitles.join(', '),
    assignedGradeCounts,
    totalEducationClassCount,
    hasStoreAssignment,
  }
}

function sessionIsoDatesOnly(row: UjatInstitutionApplicationRow): string[] {
  return [...row.sessionIsoDates].sort()
}

function gradeCountsFromApplicationRow(
  row: UjatInstitutionApplicationRow
): {
  assignedGradeCounts: UjatScheduleConfirmRow['assignedGradeCounts']
  totalEducationClassCount: number
} {
  const assignedGradeCounts = emptyGradeCounts()
  let totalEducationClassCount = 0
  for (const grade of row.gradeClassCounts) {
    const label = grade.gradeLabel as (typeof UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS)[number]
    if (label in assignedGradeCounts) {
      assignedGradeCounts[label] += grade.classCount ?? 0
      totalEducationClassCount += grade.classCount ?? 0
    }
  }
  return { assignedGradeCounts, totalEducationClassCount }
}

export function buildUjatScheduleConfirmRows(
  regionKey: UjatInstitutionApplicationRegionKey,
  sourceRows: readonly UjatInstitutionApplicationRow[] = []
): UjatScheduleConfirmRow[] {
  const source = sourceRows.filter(
    row => row.regionKey === regionKey && row.tempAssignmentStatus === 'temp_assigned'
  )

  return source.map((row, index) => {
    const snapshot = buildFromScheduleAssignStore(row.id, regionKey)
    const isoDates = snapshot.hasStoreAssignment
      ? snapshot.confirmedScheduleIsoDates
      : sessionIsoDatesOnly(row)
    const grades = snapshot.hasStoreAssignment
      ? {
          assignedGradeCounts: snapshot.assignedGradeCounts,
          totalEducationClassCount: snapshot.totalEducationClassCount,
        }
      : gradeCountsFromApplicationRow(row)

    return {
      id: row.id,
      regionKey: row.regionKey,
      no: source.length - index,
      institutionName: row.institutionName,
      scheduleConfirmStatus: row.scheduleConfirmStatus ?? null,
      assignedInstructorCount: row.assignedInstructorCount ?? null,
      confirmedScheduleDisplay:
        (snapshot.hasStoreAssignment
          ? snapshot.confirmedScheduleDisplay
          : isoDates.map(formatScheduleColumnTitle).join(', ')) || '-',
      confirmedScheduleIsoDates: isoDates,
      assignedGradeCounts: grades.assignedGradeCounts,
      totalEducationClassCount: grades.totalEducationClassCount,
      teacherName: row.teacherName,
    }
  })
}
