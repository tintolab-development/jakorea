import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  UJAT_ASSIGNMENT_FILTER_ALL,
  UJAT_ASSIGNMENT_SUBMISSION_STATUS_LABEL,
  UJAT_ASSIGNMENT_SUBMISSION_STATUS_ORDER,
  type UjatAssignmentSubmissionStatusKey,
} from './types'

const submissionStatusOptions = [
  { label: '전체', value: UJAT_ASSIGNMENT_FILTER_ALL },
  ...UJAT_ASSIGNMENT_SUBMISSION_STATUS_ORDER.map(value => ({
    label: UJAT_ASSIGNMENT_SUBMISSION_STATUS_LABEL[value],
    value,
  })),
]

export function buildUjatAssignmentFilterFields(
  educationDateOptions: Array<{ label: string; value: string }>,
  institutionOptions: Array<{ label: string; value: string }>
): FilterFieldConfig[] {
  const dateOptions = [
    { label: '전체', value: UJAT_ASSIGNMENT_FILTER_ALL },
    ...educationDateOptions,
  ]
  const institutionSelectOptions = [
    { label: '전체', value: UJAT_ASSIGNMENT_FILTER_ALL },
    ...institutionOptions,
  ]

  return [
    {
      key: 'educationDate',
      type: 'select',
      label: '교육 진행일',
      placeholder: '전체',
      options: dateOptions,
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'volunteerName',
      type: 'search',
      label: '봉사자명',
      placeholder: '봉사자명을 입력해 주세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'institutionName',
      type: 'select',
      label: '배정 기관',
      placeholder: '전체',
      options: institutionSelectOptions,
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'submissionStatus',
      type: 'select',
      label: '제출 현황',
      placeholder: '전체',
      options: submissionStatusOptions,
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
  ]
}

export type { UjatAssignmentSubmissionStatusKey }
