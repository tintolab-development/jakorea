import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  UJAT_DOCUMENT_SCREENING_STATUS_LABELS,
  UJAT_MANAGER_EVALUATION_LABELS,
  UJAT_MANAGER_EVALUATION_ORDER,
  UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS,
  UJAT_VOLUNTEER_GRADE_OPTIONS,
  type UjatDocumentScreeningStatus,
  type UjatManagerEvaluation,
  type UjatVolunteerApplicationType,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { getUjatVolunteerPreferredRegionLabels } from '@/features/program/ujat/lib/ujat-education-regions'

const ALL = 'ALL'

const gradeOptions = [
  { label: '전체', value: ALL },
  ...UJAT_VOLUNTEER_GRADE_OPTIONS.map(g => ({ label: g, value: g })),
]

const experienceOptions = [
  { label: '전체', value: ALL },
  { label: '있음', value: 'yes' },
  { label: '없음', value: 'no' },
]

const applicationTypeOptions = [
  { label: '전체', value: ALL },
  ...(
    Object.entries(UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS) as [
      UjatVolunteerApplicationType,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

const managerEvaluationOptions = [
  { label: '전체', value: ALL },
  ...UJAT_MANAGER_EVALUATION_ORDER.map((value: UjatManagerEvaluation) => ({
    label: UJAT_MANAGER_EVALUATION_LABELS[value],
    value,
  })),
]

const screeningStatusOptions = [
  { label: '전체', value: ALL },
  ...(
    Object.entries(UJAT_DOCUMENT_SCREENING_STATUS_LABELS) as [UjatDocumentScreeningStatus, string][]
  ).map(([value, label]) => ({ label, value })),
]

export const UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL = ALL

export type UjatVolunteerDocScreeningFilters = {
  volunteerName: string
  grade: string
  preferredRegion: string
  educationExperience: string
  applicationType: string
  managerAEvaluation: string
  managerBEvaluation: string
  documentScreeningStatus: string
}

export const DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS: UjatVolunteerDocScreeningFilters = {
  volunteerName: '',
  grade: ALL,
  preferredRegion: ALL,
  educationExperience: ALL,
  applicationType: ALL,
  managerAEvaluation: ALL,
  managerBEvaluation: ALL,
  documentScreeningStatus: ALL,
}

/** 2행 하단(담당자 평가·심사 현황) — `mergedAutoFillTrailingFieldKeys` */
export const UJAT_VOLUNTEER_DOC_SCREENING_TRAILING_FILTER_KEYS = [
  'managerAEvaluation',
  'managerBEvaluation',
  'documentScreeningStatus',
] as const

export function buildUjatVolunteerDocScreeningFilterRows(): FilterFieldConfig[][] {
  const regionOptions = [
    { label: '전체', value: ALL },
    ...getUjatVolunteerPreferredRegionLabels().map(label => ({ label, value: label })),
  ]

  return [
    [
      {
        key: 'volunteerName',
        type: 'search',
        label: '신청 봉사자명',
        placeholder: '봉사자명을 입력하세요',
      },
      {
        key: 'grade',
        type: 'select',
        label: '신청자 학년',
        placeholder: '전체',
        options: gradeOptions,
      },
      {
        key: 'preferredRegion',
        type: 'select',
        label: '희망 교육 활동 지역',
        placeholder: '전체',
        options: regionOptions,
      },
      {
        key: 'educationExperience',
        type: 'select',
        label: '교육 진행 경험',
        placeholder: '전체',
        options: experienceOptions,
      },
      {
        key: 'applicationType',
        type: 'select',
        label: '지원 형태',
        placeholder: '전체',
        options: applicationTypeOptions,
      },
    ],
    [
      {
        key: 'managerAEvaluation',
        type: 'select',
        label: '담당자 A 평가',
        placeholder: '전체',
        options: managerEvaluationOptions,
      },
      {
        key: 'managerBEvaluation',
        type: 'select',
        label: '담당자 B 평가',
        placeholder: '전체',
        options: managerEvaluationOptions,
      },
      {
        key: 'documentScreeningStatus',
        type: 'select',
        label: '1차 서류 심사 현황',
        placeholder: '전체',
        options: screeningStatusOptions,
      },
    ],
  ]
}
