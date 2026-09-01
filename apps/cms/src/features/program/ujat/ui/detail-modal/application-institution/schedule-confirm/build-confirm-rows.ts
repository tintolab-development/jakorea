import {
  getUjatInstitutionApplicationMockRows,
  getUjatInstitutionScheduleConfirmStatus,
} from '@/data/mock/ujat-institution-application-mock'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '../education-schedule'
import { parseGradeClassSectionValue } from '../list/grade-class-sections'
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

  for (const { isoDate, title } of UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES) {
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

export function buildUjatScheduleConfirmRows(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatScheduleConfirmRow[] {
  const source = getUjatInstitutionApplicationMockRows().filter(
    row => row.regionKey === regionKey && row.tempAssignmentStatus === 'temp_assigned'
  )

  return source.map((row, index) => {
    const snapshot = buildFromScheduleAssignStore(row.id, regionKey)

    return {
      id: row.id,
      regionKey: row.regionKey,
      no: source.length - index,
      institutionName: row.institutionName,
      scheduleConfirmStatus: getUjatInstitutionScheduleConfirmStatus(row.id),
      confirmedScheduleDisplay: snapshot.confirmedScheduleDisplay || '-',
      confirmedScheduleIsoDates: snapshot.confirmedScheduleIsoDates,
      assignedGradeCounts: snapshot.assignedGradeCounts,
      totalEducationClassCount: snapshot.totalEducationClassCount,
      teacherName: row.teacherName,
    }
  })
}
