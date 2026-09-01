import type {
  UjatEducationProgressRegionValues,
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from '@/features/program/ujat/ui/detail-modal/progress/progress-summary/types'
import { buildRegionRow } from '@/features/program/ujat/ui/detail-modal/progress/progress-summary/summary-display'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { resolveUjatRegionCapacitySemesterValues } from '@/features/program/ujat/lib/ujat-region-capacity-display'
import { getUjatInstitutionApplicationMockRows } from '@/data/mock/ujat-institution-application-mock'
import { getUjatEducationProgressInstitutions } from '@/data/mock/ujat-education-progress-institutions-mock'
import { getUjatEducationProgressVolunteerMockRows } from '@/data/mock/ujat-education-progress-volunteers-mock'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'

const SUMMARY_PROGRAM_ID = 'ujat-education-progress-summary'
const STUDENTS_PER_CLASS = 28

function emptyRegionValues(fill: number | null = null): UjatEducationProgressRegionValues {
  return Object.fromEntries(
    listUjatEducationRegionsActive().map(region => [
      region.key,
      fill,
    ])
  ) as UjatEducationProgressRegionValues
}

function addToRegion(
  values: UjatEducationProgressRegionValues,
  regionKey: UjatInstitutionApplicationRegionKey,
  amount: number
) {
  values[regionKey] = (values[regionKey] ?? 0) + amount
}

function sumRows(
  a: UjatEducationProgressRegionValues,
  b: UjatEducationProgressRegionValues
): UjatEducationProgressRegionValues {
  const result = emptyRegionValues()
  for (const region of listUjatEducationRegionsActive()) {
    const key = region.key as UjatInstitutionApplicationRegionKey
    const av = a[key]
    const bv = b[key]
    result[key] = av == null && bv == null ? null : (av ?? 0) + (bv ?? 0)
  }
  return result
}

function countAppliedSchoolRows(): UjatEducationProgressRegionValues {
  const values = emptyRegionValues(0)
  for (const row of getUjatInstitutionApplicationMockRows()) {
    addToRegion(values, row.regionKey, 1)
  }
  return values
}

function buildSchoolMetrics(half: EducationProgressHalfKey) {
  const rows = getUjatEducationProgressInstitutions(SUMMARY_PROGRAM_ID, half)
  const schoolSets = new Map<UjatInstitutionApplicationRegionKey, Set<string>>()
  const classes = emptyRegionValues(0)

  for (const row of rows) {
    const regionKey = row.regionKey
    const set = schoolSets.get(regionKey) ?? new Set<string>()
    set.add(row.sourceInstitutionId)
    schoolSets.set(regionKey, set)
    addToRegion(classes, regionKey, row.totalEducationClassCount)
  }

  const schools = emptyRegionValues(0)
  for (const [regionKey, set] of schoolSets) {
    schools[regionKey] = set.size
  }

  const students = emptyRegionValues()
  for (const region of listUjatEducationRegionsActive()) {
    const key = region.key as UjatInstitutionApplicationRegionKey
    const classCount = classes[key]
    students[key] = classCount == null ? null : classCount * STUDENTS_PER_CLASS
  }

  return {
    operating_schools: buildRegionRow(schools),
    operating_classes: buildRegionRow(classes),
    operating_students: buildRegionRow(students),
  }
}

function buildSchoolSummary(): UjatEducationProgressSchoolSummary {
  const h1Metrics = buildSchoolMetrics('h1')
  const h2Metrics = buildSchoolMetrics('h2')

  return {
    appliedSchools: buildRegionRow(countAppliedSchoolRows()),
    semesters: [
    {
      tone: 'h1',
      label: '1학기',
      metrics: h1Metrics,
    },
    {
      tone: 'h2',
      label: '2학기',
      metrics: h2Metrics,
    },
    {
      tone: 'grand',
      label: '2026년 종합',
      metrics: {
        operating_schools: buildRegionRow(
          sumRows(h1Metrics.operating_schools.regions, h2Metrics.operating_schools.regions)
        ),
        operating_classes: buildRegionRow(
          sumRows(h1Metrics.operating_classes.regions, h2Metrics.operating_classes.regions)
        ),
        operating_students: buildRegionRow(
          sumRows(h1Metrics.operating_students.regions, h2Metrics.operating_students.regions)
        ),
      },
    },
  ],
  }
}

function readCapacityVolunteerValues(half: EducationProgressHalfKey): UjatEducationProgressRegionValues {
  const capacity = resolveUjatRegionCapacitySemesterValues(half)
  const values = emptyRegionValues(0)
  for (const region of listUjatEducationRegionsActive()) {
    const key = region.key as UjatInstitutionApplicationRegionKey
    const raw = capacity[region.label]?.volunteerCount?.trim()
    values[key] = raw ? Number(raw) : 0
  }
  return values
}

function countFinalVolunteerRows(half: EducationProgressHalfKey): UjatEducationProgressRegionValues {
  const values = emptyRegionValues(0)
  const rows = getUjatEducationProgressVolunteerMockRows(half)
  for (const row of rows) {
    if (row.assignmentStatus === 'activity_abandoned') continue
    addToRegion(values, row.regionKey, 1)
  }
  return values
}

function buildVolunteerSummary(): UjatEducationProgressVolunteerSummary {
  const plannedH1 = readCapacityVolunteerValues('h1')
  const plannedH2 = readCapacityVolunteerValues('h2')
  const finalH1 = countFinalVolunteerRows('h1')
  const finalH2 = countFinalVolunteerRows('h2')

  return {
    rows: [
    {
      key: 'planned_selection',
      label: '선발 예정 인원',
      row: buildRegionRow(sumRows(plannedH1, plannedH2)),
    },
    {
      key: 'gen36_final_pass',
      label: '상반기 최종 합격',
      tone: 'h1',
      row: buildRegionRow(finalH1),
    },
    {
      key: 'gen37_final_pass',
      label: '하반기 최종 합격',
      tone: 'h2',
      row: buildRegionRow(finalH2),
    },
    {
      key: 'final_2026',
      label: '2026년 봉사단 최종 인원',
      tone: 'grand',
      row: buildRegionRow(sumRows(finalH1, finalH2)),
    },
  ],
  }
}

export function getUjatEducationProgressSchoolSummary(): UjatEducationProgressSchoolSummary {
  return buildSchoolSummary()
}

export function getUjatEducationProgressVolunteerSummary(): UjatEducationProgressVolunteerSummary {
  return buildVolunteerSummary()
}
