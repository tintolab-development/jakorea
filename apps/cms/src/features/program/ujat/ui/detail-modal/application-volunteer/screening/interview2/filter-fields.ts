import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
  VOLUNTEER_ACTIVITY_WITHDRAWN_LABEL,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-constants'
import {
  type UjatSecondInterviewScreeningStatus,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { getUjatVolunteerPreferredRegionLabels } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'

const ALL = 'ALL'

const scoreOptions = [
  { label: '전체', value: ALL },
  ...Array.from({ length: 10 }, (_, index) => {
    const score = String(index + 1)
    return { label: score, value: score }
  }),
  { label: '-', value: 'empty' },
]

const INTERVIEW2_STATUS_FILTER_ORDER: Array<UjatSecondInterviewScreeningStatus | 'withdrawn'> = [
  'waiting',
  'completed',
  'pass',
  'reserve1',
  'reserve2',
  'reserve3',
  'reserve4',
  'fail',
  'withdrawn',
]

const screeningStatusOptions = [
  { label: '전체', value: ALL },
  ...INTERVIEW2_STATUS_FILTER_ORDER.map(value => ({
    label:
      value === 'withdrawn'
        ? VOLUNTEER_ACTIVITY_WITHDRAWN_LABEL
        : SECOND_INTERVIEW_SCREENING_STATUS_LABELS[value],
    value,
  })),
]

export const UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL = ALL

export type UjatVolunteerInterview2Filters = {
  volunteerName: string
  preferredRegion: string
  interviewDate: string
  interviewTime: string
  totalScore: string
  secondInterviewScreeningStatus: string
}

export const DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS: UjatVolunteerInterview2Filters = {
  volunteerName: '',
  preferredRegion: ALL,
  interviewDate: ALL,
  interviewTime: ALL,
  totalScore: ALL,
  secondInterviewScreeningStatus: ALL,
}

export function buildUjatVolunteerInterview2DateOptions(rows: UjatVolunteerApplicantRow[]) {
  const dates = Array.from(
    new Set(
      rows.map(row => row.assignedInterviewDateLabel).filter((d): d is string => Boolean(d))
    )
  ).sort()
  return [{ label: '전체', value: ALL }, ...dates.map(d => ({ label: d, value: d }))]
}

export function buildUjatVolunteerInterview2TimeOptions(rows: UjatVolunteerApplicantRow[]) {
  const times = Array.from(
    new Set(rows.map(row => row.assignedInterviewTime).filter((t): t is string => Boolean(t)))
  ).sort()
  return [{ label: '전체', value: ALL }, ...times.map(t => ({ label: t, value: t }))]
}

export function buildUjatVolunteerInterview2FilterRows(
  rows: UjatVolunteerApplicantRow[],
  options: { includeInterviewDate?: boolean } = {}
): FilterFieldConfig[][] {
  const includeInterviewDate = options.includeInterviewDate ?? true
  const dateOptions = buildUjatVolunteerInterview2DateOptions(rows)
  const timeOptions = buildUjatVolunteerInterview2TimeOptions(rows)
  const regionOptions = [
    { label: '전체', value: ALL },
    ...getUjatVolunteerPreferredRegionLabels().map(label => ({ label, value: label })),
  ]

  const fields: FilterFieldConfig[] = [
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
    ...(includeInterviewDate
      ? [
          {
        key: 'interviewDate',
        type: 'select',
        label: '면접일',
        placeholder: '전체',
        options: dateOptions,
          } satisfies FilterFieldConfig,
        ]
      : []),
    {
      key: 'interviewTime',
      type: 'select',
      label: '면접 시간',
      placeholder: '전체',
      options: timeOptions,
    },
    {
      key: 'totalScore',
      type: 'select',
      label: '점수 총합',
      placeholder: '전체',
      options: scoreOptions,
    },
    {
      key: 'secondInterviewScreeningStatus',
      type: 'select',
      label: '2차 면접 심사 현황',
      placeholder: '전체',
      options: screeningStatusOptions,
    },
  ]

  return [fields]
}
