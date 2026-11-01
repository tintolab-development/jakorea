import {
  findUjatEducationRegionKeyByCode,
  listUjatEducationRegionsActive,
} from '@/features/program/ujat/lib/ujat-education-regions'
import type { EducationProgressSummaryResponse } from '@/shared/api/generated/dashboard/schemas/educationProgressSummaryResponse'
import type { HalfProgressCounts } from '@/shared/api/generated/dashboard/schemas/halfProgressCounts'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { buildRegionRow } from './summary-display'
import type {
  UjatEducationProgressRegionValues,
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from './types'

function nullRegionValues(): UjatEducationProgressRegionValues {
  return Object.fromEntries(
    listUjatEducationRegionsActive().map(region => [region.key, null])
  ) as UjatEducationProgressRegionValues
}

function readCount(
  counts: HalfProgressCounts | undefined,
  key: keyof HalfProgressCounts
): number | null {
  const value = counts?.[key]
  return typeof value === 'number' ? value : null
}

function mapRegionValues(
  response: EducationProgressSummaryResponse,
  read: (row: NonNullable<EducationProgressSummaryResponse['regions']>[number]) => number | null
): UjatEducationProgressRegionValues {
  const values = nullRegionValues()
  for (const row of response.regions ?? []) {
    const regionKey = findUjatEducationRegionKeyByCode(row.educationRegionCode)
    if (!regionKey || !(regionKey in values)) continue
    values[regionKey as UjatInstitutionApplicationRegionKey] = read(row)
  }
  return values
}

export function adaptUjatEducationProgressSummary(response: EducationProgressSummaryResponse): {
  schoolSummary: UjatEducationProgressSchoolSummary
  volunteerSummary: UjatEducationProgressVolunteerSummary
} {
  const appliedSchools = mapRegionValues(response, row =>
    typeof row.appliedSchoolCount === 'number' ? row.appliedSchoolCount : null
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
    schoolSummary: {
      appliedSchools: buildRegionRow(appliedSchools),
      semesters: [
        {
          tone: 'h1',
          label: '상반기',
          metrics: {
            operating_schools: buildRegionRow(firstHalfSchools),
            operating_classes: buildRegionRow(firstHalfClasses),
            operating_students: buildRegionRow(firstHalfStudents),
          },
        },
        {
          tone: 'h2',
          label: '하반기',
          metrics: {
            operating_schools: buildRegionRow(secondHalfSchools),
            operating_classes: buildRegionRow(secondHalfClasses),
            operating_students: buildRegionRow(secondHalfStudents),
          },
        },
      ],
    },
    volunteerSummary: {
      rows: [
        {
          key: 'h1_final_pass',
          label: '상반기 최종 합격',
          tone: 'h1',
          row: buildRegionRow(firstHalfVolunteers),
        },
        {
          key: 'h2_final_pass',
          label: '하반기 최종 합격',
          tone: 'h2',
          row: buildRegionRow(secondHalfVolunteers),
        },
        {
          key: 'final_total',
          label: '합계',
          tone: 'grand',
          mergedTotalOnly: true,
          row: buildRegionRow(totalVolunteers),
        },
      ],
    },
  }
}
