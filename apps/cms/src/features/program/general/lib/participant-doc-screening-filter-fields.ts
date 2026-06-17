import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import {
  GENERAL_DOCUMENT_SCREENING_STATUS_LABELS,
  GENERAL_MANAGER_EVALUATION_LABELS,
  GENERAL_MANAGER_EVALUATION_ORDER,
  type GeneralDocumentScreeningStatus,
  type GeneralManagerEvaluation,
} from './volunteer-screening-constants'
import { GENERAL_VOLUNTEER_FILTER_ALL } from './volunteer-doc-screening-filter-fields'

const FILTER_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX
const selectStyle = { width: FILTER_WIDTH } as const

const GRADE_OPTIONS = [
  { label: '전체', value: GENERAL_VOLUNTEER_FILTER_ALL },
  { label: '1학년', value: '1학년' },
  { label: '2학년', value: '2학년' },
  { label: '3학년', value: '3학년' },
  { label: '4학년', value: '4학년' },
  { label: '5학년', value: '5학년' },
  { label: '6학년', value: '6학년' },
]

const managerEvaluationOptions = [
  { label: '전체', value: GENERAL_VOLUNTEER_FILTER_ALL },
  ...GENERAL_MANAGER_EVALUATION_ORDER.map((value: GeneralManagerEvaluation) => ({
    label: GENERAL_MANAGER_EVALUATION_LABELS[value],
    value,
  })),
]

const screeningStatusOptions = [
  { label: '전체', value: GENERAL_VOLUNTEER_FILTER_ALL },
  ...(
    Object.entries(GENERAL_DOCUMENT_SCREENING_STATUS_LABELS) as [
      GeneralDocumentScreeningStatus,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

function buildFilterField(config: FilterFieldConfig): FilterFieldConfig {
  return {
    width: FILTER_WIDTH,
    style: config.type === 'select' ? selectStyle : undefined,
    ...config,
  }
}

export type GeneralParticipantDoc1Filters = {
  applicantName: string
  grade: string
  managerAEvaluation: string
  managerBEvaluation: string
  documentScreeningStatus: string
}

export const DEFAULT_GENERAL_PARTICIPANT_DOC1_FILTERS: GeneralParticipantDoc1Filters = {
  applicantName: '',
  grade: GENERAL_VOLUNTEER_FILTER_ALL,
  managerAEvaluation: GENERAL_VOLUNTEER_FILTER_ALL,
  managerBEvaluation: GENERAL_VOLUNTEER_FILTER_ALL,
  documentScreeningStatus: GENERAL_VOLUNTEER_FILTER_ALL,
}

export function buildGeneralParticipantDoc1FilterRows(): FilterFieldConfig[][] {
  return [
    [
      buildFilterField({
        key: 'applicantName',
        type: 'search',
        label: '신청자명',
        placeholder: '신청자명을 입력하세요',
      }),
      buildFilterField({
        key: 'grade',
        type: 'select',
        label: '신청 학년',
        placeholder: '전체',
        options: GRADE_OPTIONS,
      }),
      buildFilterField({
        key: 'managerAEvaluation',
        type: 'select',
        label: '담당자 A 평가',
        placeholder: '전체',
        options: managerEvaluationOptions,
      }),
      buildFilterField({
        key: 'managerBEvaluation',
        type: 'select',
        label: '담당자 B 평가',
        placeholder: '전체',
        options: managerEvaluationOptions,
      }),
      buildFilterField({
        key: 'documentScreeningStatus',
        type: 'select',
        label: '1차 서류 심사 현황',
        placeholder: '전체',
        options: screeningStatusOptions,
      }),
    ],
  ]
}

export function filterGeneralParticipantDoc1Applications(
  rows: GeneralIndividualApplicantRow[],
  filters: GeneralParticipantDoc1Filters | Record<string, unknown>
): GeneralIndividualApplicantRow[] {
  const nameQ = String(filters.applicantName ?? '').trim().toLowerCase()
  const grade = String(filters.grade ?? GENERAL_VOLUNTEER_FILTER_ALL)
  const managerA = String(filters.managerAEvaluation ?? GENERAL_VOLUNTEER_FILTER_ALL)
  const managerB = String(filters.managerBEvaluation ?? GENERAL_VOLUNTEER_FILTER_ALL)
  const docStatus = String(filters.documentScreeningStatus ?? GENERAL_VOLUNTEER_FILTER_ALL)

  return rows.filter(row => {
    if (nameQ && !row.applicantName.toLowerCase().includes(nameQ)) return false
    if (grade !== GENERAL_VOLUNTEER_FILTER_ALL && row.educationGrade !== grade) return false
    if (managerA !== GENERAL_VOLUNTEER_FILTER_ALL && row.managerAEvaluation !== managerA) {
      return false
    }
    if (managerB !== GENERAL_VOLUNTEER_FILTER_ALL && row.managerBEvaluation !== managerB) {
      return false
    }
    if (
      docStatus !== GENERAL_VOLUNTEER_FILTER_ALL &&
      row.documentScreeningStatus !== docStatus
    ) {
      return false
    }
    return true
  })
}
