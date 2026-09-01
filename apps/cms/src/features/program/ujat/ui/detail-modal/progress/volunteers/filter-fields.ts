import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import {
  UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL,
  UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS,
  type UjatEducationProgressVolunteerAssignmentStatus,
} from './types'

export const UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL = ''

const gradeOptions = [
  { label: '전체', value: UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL },
  ...UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS.map(grade => ({ label: grade, value: grade })),
]

const assignmentStatusOptions = [
  { label: '전체', value: UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL },
  ...(
    Object.entries(UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL) as [
      UjatEducationProgressVolunteerAssignmentStatus,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

export function buildUjatEducationProgressVolunteerFilterFields(): FilterFieldConfig[] {
  const regionOptions = [
    { label: '전체', value: UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL },
    ...listUjatEducationRegionsActive().map(region => ({
      label: region.label,
      value: region.key,
    })),
  ]

  return [
    {
      key: 'volunteerName',
      type: 'search',
      label: '봉사자명',
      placeholder: '봉사자명을 입력하세요',
      width: '25%',
    },
    {
      key: 'grade',
      type: 'select',
      label: '봉사자 학년',
      placeholder: '전체',
      options: gradeOptions,
      width: '25%',
    },
    {
      key: 'regionKey',
      type: 'select',
      label: '교육 활동 지역',
      placeholder: '전체',
      options: regionOptions,
      width: '25%',
    },
    {
      key: 'assignmentStatus',
      type: 'select',
      label: '교육 배정 현황',
      placeholder: '전체',
      options: assignmentStatusOptions,
      width: '25%',
    },
  ]
}

/** @deprecated `buildUjatEducationProgressVolunteerFilterFields()` */
export const UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_FIELDS = buildUjatEducationProgressVolunteerFilterFields()
