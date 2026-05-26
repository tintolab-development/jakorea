import type {
  UjatEducationProgressRegionValues,
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from '@/features/program/ujat/ui/detail-modal/progress/progress-summary/types'
import { buildRegionRow } from '@/features/program/ujat/ui/detail-modal/progress/progress-summary/summary-display'

function regionValues(
  values: [
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
  ]
): UjatEducationProgressRegionValues {
  return {
    seoul: values[0],
    gyeonggi_south: values[1],
    incheon: values[2],
    daejeon: values[3],
    daegu: values[4],
    busan: values[5],
    gwangju: values[6],
    jeonbuk_jeonju: values[7],
  }
}

const EMPTY_REGIONS = regionValues([null, null, null, null, null, null, null, null])

const H1_OPERATING_SCHOOLS = buildRegionRow(regionValues([7, 7, 3, 4, 4, 5, 3, 4]), 41)
const H1_OPERATING_CLASSES = buildRegionRow(regionValues([14, 14, 6, 8, 8, 10, 6, 8]), 82)
const H1_OPERATING_STUDENTS = buildRegionRow(
  regionValues([350, 350, 150, 200, 200, 250, 150, 200]),
  2050
)

const H2_EMPTY_METRICS = {
  operating_schools: buildRegionRow({ ...EMPTY_REGIONS }, null),
  operating_classes: buildRegionRow({ ...EMPTY_REGIONS }, null),
  operating_students: buildRegionRow({ ...EMPTY_REGIONS }, null),
}

const SCHOOL_SUMMARY: UjatEducationProgressSchoolSummary = {
  appliedSchools: buildRegionRow(regionValues([8, 10, 3, 4, 5, 6, 3, 4]), 52),
  semesters: [
    {
      tone: 'h1',
      label: '1학기',
      metrics: {
        operating_schools: H1_OPERATING_SCHOOLS,
        operating_classes: H1_OPERATING_CLASSES,
        operating_students: H1_OPERATING_STUDENTS,
      },
    },
    {
      tone: 'h2',
      label: '2학기',
      metrics: H2_EMPTY_METRICS,
    },
    {
      tone: 'grand',
      label: '2026년 종합',
      metrics: {
        operating_schools: H1_OPERATING_SCHOOLS,
        operating_classes: H1_OPERATING_CLASSES,
        operating_students: H1_OPERATING_STUDENTS,
      },
    },
  ],
}

const VOLUNTEER_SUMMARY: UjatEducationProgressVolunteerSummary = {
  rows: [
    {
      key: 'planned_selection',
      label: '선발 예정 인원',
      row: buildRegionRow(regionValues([25, 20, 8, 10, 12, 12, 8, 10]), 105),
    },
    {
      key: 'gen36_final_pass',
      label: '36기 최종 합격',
      tone: 'h1',
      row: buildRegionRow(regionValues([23, 17, 7, 9, 12, 12, 7, 9]), 96),
    },
    {
      key: 'gen37_final_pass',
      label: '37기 최종 합격',
      tone: 'h2',
      row: buildRegionRow({ ...EMPTY_REGIONS }, null),
    },
    {
      key: 'final_2026',
      label: '2026 봉사단 최종 인원',
      tone: 'grand',
      row: buildRegionRow({ ...EMPTY_REGIONS }, 96),
      mergedTotalOnly: true,
    },
  ],
}

export function getUjatEducationProgressSchoolSummary(): UjatEducationProgressSchoolSummary {
  return SCHOOL_SUMMARY
}

export function getUjatEducationProgressVolunteerSummary(): UjatEducationProgressVolunteerSummary {
  return VOLUNTEER_SUMMARY
}
