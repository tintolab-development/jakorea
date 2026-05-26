import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'

export type UjatEducationProgressSummaryTone = 'h1' | 'h2' | 'grand'

export type UjatEducationProgressSummaryCellValue = number | null

export type UjatEducationProgressRegionValues = Record<
  UjatInstitutionApplicationRegionKey,
  UjatEducationProgressSummaryCellValue
>

export type UjatEducationProgressRegionRow = {
  regions: UjatEducationProgressRegionValues
  total: UjatEducationProgressSummaryCellValue
}

export type UjatEducationProgressSchoolMetricKey =
  | 'operating_schools'
  | 'operating_classes'
  | 'operating_students'

export const UJAT_EDU_PROGRESS_SCHOOL_METRIC_LABEL: Record<
  UjatEducationProgressSchoolMetricKey,
  string
> = {
  operating_schools: '진행 학교(개교)',
  operating_classes: '진행 학급 수',
  operating_students: '진행 학생 수',
} as const

export const UJAT_EDU_PROGRESS_SCHOOL_METRIC_ORDER: readonly UjatEducationProgressSchoolMetricKey[] =
  ['operating_schools', 'operating_classes', 'operating_students'] as const

export type UjatEducationProgressSchoolSemesterGroup = {
  tone: UjatEducationProgressSummaryTone
  label: string
  metrics: Record<UjatEducationProgressSchoolMetricKey, UjatEducationProgressRegionRow>
}

export type UjatEducationProgressSchoolSummary = {
  appliedSchools: UjatEducationProgressRegionRow
  semesters: UjatEducationProgressSchoolSemesterGroup[]
}

export type UjatEducationProgressVolunteerRowKey =
  | 'planned_selection'
  | 'gen36_final_pass'
  | 'gen37_final_pass'
  | 'final_2026'

export type UjatEducationProgressVolunteerSummaryRow = {
  key: UjatEducationProgressVolunteerRowKey
  label: string
  tone?: UjatEducationProgressSummaryTone
  row: UjatEducationProgressRegionRow
  /** 마지막 행: 지역 열 병합 후 중앙 표시 */
  mergedTotalOnly?: boolean
}

export type UjatEducationProgressVolunteerSummary = {
  rows: UjatEducationProgressVolunteerSummaryRow[]
}
