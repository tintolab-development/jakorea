import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL } from '@/features/program/general/lib/participating-individual-progress-assignment-types'

const FILTER_CONTROL_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX

const GRADE_OPTIONS = [
  { label: '전체', value: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL },
  { label: '1학년', value: '1학년' },
  { label: '2학년', value: '2학년' },
  { label: '3학년', value: '3학년' },
  { label: '4학년', value: '4학년' },
  { label: '5학년', value: '5학년' },
  { label: '6학년', value: '6학년' },
]

const submissionStatusOptions = [
  { label: '전체', value: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL },
  { label: '미제출', value: 'not_submitted' },
  { label: '제출', value: 'submitted' },
]

export function buildParticipatingIndividualProgressAssignmentFilterFields(
  educationScheduleOptions: Array<{ label: string; value: string }>
): FilterFieldConfig[] {
  const scheduleOptions = [
    { label: '전체', value: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL },
    ...educationScheduleOptions,
  ]

  return [
    {
      key: 'educationSchedule',
      type: 'select',
      label: '교육 일정',
      placeholder: '전체',
      options: scheduleOptions,
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'participantName',
      type: 'search',
      label: '참여자명',
      placeholder: '참여자명을 입력하세요',
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'affiliation',
      type: 'search',
      label: '소속',
      placeholder: '소속을 입력하세요',
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'educationGrade',
      type: 'select',
      label: '학년',
      placeholder: '전체',
      options: GRADE_OPTIONS,
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'submissionStatus',
      type: 'select',
      label: '제출 현황',
      placeholder: '전체',
      options: submissionStatusOptions,
      width: FILTER_CONTROL_WIDTH,
    },
  ]
}
