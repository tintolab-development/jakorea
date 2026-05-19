import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
  UJAT_SECOND_INTERVIEW_SCREENING_STATUS_ORDER,
  UJAT_VOLUNTEER_PREFERRED_REGIONS,
  type UjatSecondInterviewScreeningStatus,
} from '@/features/program/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'

const ALL = 'ALL'

const regionOptions = [
  { label: '전체', value: ALL },
  ...UJAT_VOLUNTEER_PREFERRED_REGIONS.map(r => ({ label: r, value: r })),
]

const scoreOptions = [
  { label: '전체', value: ALL },
  { label: '90점 이상', value: 'gte90' },
  { label: '80점 이상', value: 'gte80' },
  { label: '미입력', value: 'empty' },
]

const screeningStatusOptions = [
  { label: '전체', value: ALL },
  ...UJAT_SECOND_INTERVIEW_SCREENING_STATUS_ORDER.map((value: UjatSecondInterviewScreeningStatus) => ({
    label: UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS[value],
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
  rows: UjatVolunteerApplicantRow[]
): FilterFieldConfig[][] {
  const dateOptions = buildUjatVolunteerInterview2DateOptions(rows)
  const timeOptions = buildUjatVolunteerInterview2TimeOptions(rows)

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
        key: 'interviewDate',
        type: 'select',
        label: '면접일',
        placeholder: '전체',
        options: dateOptions,
      },
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
    ],
  ]
}
