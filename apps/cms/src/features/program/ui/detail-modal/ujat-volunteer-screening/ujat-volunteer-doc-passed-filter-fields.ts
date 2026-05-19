import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
  UJAT_VOLUNTEER_PREFERRED_REGIONS,
  type UjatInterviewAssignmentStatus,
} from '@/features/program/model/ujat-volunteer-screening-constants'

const ALL = 'ALL'

const regionOptions = [
  { label: '전체', value: ALL },
  ...UJAT_VOLUNTEER_PREFERRED_REGIONS.map(r => ({ label: r, value: r })),
]

const experienceOptions = [
  { label: '전체', value: ALL },
  { label: '있음', value: 'yes' },
  { label: '없음', value: 'no' },
]

const interviewAssignmentOptions = [
  { label: '전체', value: ALL },
  ...(
    Object.entries(UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS) as [
      UjatInterviewAssignmentStatus,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

export const UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL = ALL

export type UjatVolunteerDocPassedFilters = {
  volunteerName: string
  preferredRegion: string
  educationExperience: string
  interviewAssignmentStatus: string
}

export const DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS: UjatVolunteerDocPassedFilters = {
  volunteerName: '',
  preferredRegion: ALL,
  educationExperience: ALL,
  interviewAssignmentStatus: ALL,
}

export function buildUjatVolunteerDocPassedFilterRows(): FilterFieldConfig[][] {
  return [
    [
      {
        key: 'volunteerName',
        type: 'search',
        label: '신청 봉사자명',
        placeholder: '봉사자명을 입력하세요',
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
        label: '교육 진행 경험 여부',
        placeholder: '전체',
        options: experienceOptions,
      },
      {
        key: 'interviewAssignmentStatus',
        type: 'select',
        label: '면접일 배정 현황',
        placeholder: '전체',
        options: interviewAssignmentOptions,
      },
    ],
  ]
}
