import type { EducationProgressSummaryResponse } from '@/shared/api/generated/dashboard/schemas/educationProgressSummaryResponse'
import type { HalfProgressCounts } from '@/shared/api/generated/dashboard/schemas/halfProgressCounts'
import { buildRegionRow } from './summary-display'
import {
  copyFromEducationProgressSummaryResponse,
  schoolSemesterGroupLabel,
  UJAT_EDU_PROGRESS_PLANNED_SELECTION_LABEL,
  volunteerFinalRowLabel,
  volunteerPassRowLabel,
} from './summary-copy'
import type {
  UjatEducationProgressColumnRegion,
  UjatEducationProgressRegionValues,
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from './types'

function readCount(
  counts: HalfProgressCounts | undefined,
  key: keyof HalfProgressCounts
): number | null {
  const value = counts?.[key]
  return typeof value === 'number' ? value : null
}

export function columnRegionsFromSummaryResponse(
  response: EducationProgressSummaryResponse
): UjatEducationProgressColumnRegion[] {
  const seen = new Set<string>()
  const columns: UjatEducationProgressColumnRegion[] = []
  for (const row of response.regions ?? []) {
    const key = row.educationRegionCode?.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    columns.push({
      key,
      label: row.educationRegionName?.trim() || key,
    })
  }
  return columns
}

function mapRegionValues(
  response: EducationProgressSummaryResponse,
  read: (row: NonNullable<EducationProgressSummaryResponse['regions']>[number]) => number | null
): UjatEducationProgressRegionValues {
  const values: UjatEducationProgressRegionValues = {}
  for (const row of response.regions ?? []) {
    const key = row.educationRegionCode?.trim()
    if (!key) continue
    values[key] = read(row)
  }
  return values
}

export function adaptUjatEducationProgressSummary(response: EducationProgressSummaryResponse): {
  columnRegions: UjatEducationProgressColumnRegion[]
  schoolSummary: UjatEducationProgressSchoolSummary
  volunteerSummary: UjatEducationProgressVolunteerSummary
} {
  const copy = copyFromEducationProgressSummaryResponse(response)
  const columnRegions = columnRegionsFromSummaryResponse(response)
  const appliedSchools = mapRegionValues(response, row =>
    typeof row.appliedSchoolCount === 'number' ? row.appliedSchoolCount : null
  )
  const plannedSelection = mapRegionValues(response, row =>
    typeof row.plannedSelectionVolunteerCount === 'number'
      ? row.plannedSelectionVolunteerCount
      : null
  )
  const firstHalfSchools = mapRegionValues(response, row =>
    readCount(row.firstHalf, 'progressingSchoolCount')
  )
  const firstHalfClasses = mapRegionValues(response, row => readCount(row.firstHalf, 'classCount'))
  const firstHalfStudents = mapRegionValues(response, row =>
    readCount(row.firstHalf, 'studentCount')
  )
  const secondHalfSchools = mapRegionValues(response, row =>
    readCount(row.secondHalf, 'progressingSchoolCount')
  )
  const secondHalfClasses = mapRegionValues(response, row =>
    readCount(row.secondHalf, 'classCount')
  )
  const secondHalfStudents = mapRegionValues(response, row =>
    readCount(row.secondHalf, 'studentCount')
  )
  const totalSchools = mapRegionValues(response, row =>
    readCount(row.total, 'progressingSchoolCount')
  )
  const totalClasses = mapRegionValues(response, row => readCount(row.total, 'classCount'))
  const totalStudents = mapRegionValues(response, row => readCount(row.total, 'studentCount'))
  const firstHalfVolunteers = mapRegionValues(response, row =>
    readCount(row.firstHalf, 'finalPassVolunteerCount')
  )
  const secondHalfVolunteers = mapRegionValues(response, row =>
    readCount(row.secondHalf, 'finalPassVolunteerCount')
  )
  const totalVolunteers = mapRegionValues(response, row =>
    readCount(row.total, 'finalPassVolunteerCount')
  )

  return {
    columnRegions,
    schoolSummary: {
      appliedSchools: buildRegionRow(appliedSchools),
      semesters: [
        {
          tone: 'h1',
          label: schoolSemesterGroupLabel('h1', copy.year),
          metrics: {
            operating_schools: buildRegionRow(firstHalfSchools),
            operating_classes: buildRegionRow(firstHalfClasses),
            operating_students: buildRegionRow(firstHalfStudents),
          },
        },
        {
          tone: 'h2',
          label: schoolSemesterGroupLabel('h2', copy.year),
          metrics: {
            operating_schools: buildRegionRow(secondHalfSchools),
            operating_classes: buildRegionRow(secondHalfClasses),
            operating_students: buildRegionRow(secondHalfStudents),
          },
        },
        {
          tone: 'grand',
          label: schoolSemesterGroupLabel('grand', copy.year),
          metrics: {
            operating_schools: buildRegionRow(totalSchools),
            operating_classes: buildRegionRow(totalClasses),
            operating_students: buildRegionRow(totalStudents),
          },
        },
      ],
    },
    volunteerSummary: {
      rows: [
        {
          key: 'planned_selection',
          label: UJAT_EDU_PROGRESS_PLANNED_SELECTION_LABEL,
          row: buildRegionRow(plannedSelection),
        },
        {
          key: 'h1_final_pass',
          label: volunteerPassRowLabel('h1', copy.firstHalfTerm),
          tone: 'h1',
          row: buildRegionRow(firstHalfVolunteers),
        },
        {
          key: 'h2_final_pass',
          label: volunteerPassRowLabel('h2', copy.secondHalfTerm),
          tone: 'h2',
          row: buildRegionRow(secondHalfVolunteers),
        },
        {
          key: 'final_total',
          label: volunteerFinalRowLabel(copy.year),
          tone: 'grand',
          row: buildRegionRow(totalVolunteers),
        },
      ],
    },
  }
}
