import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
  SECOND_INTERVIEW_SCREENING_STATUS_ORDER,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-constants'
import {
  screeningApplicantNameLabel,
  screeningApplicantNamePlaceholder,
  type ScreeningSubjectKind,
} from './screening-subject-kind'
import { APPROVAL_STATUS_LABELS } from '@/shared/components/textbook-status-badge'
import {
  GENERAL_DOCUMENT_SCREENING_STATUS_LABELS,
  GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
  GENERAL_MANAGER_EVALUATION_LABELS,
  GENERAL_MANAGER_EVALUATION_ORDER,
  type GeneralDocumentScreeningStatus,
  type GeneralInterviewAssignmentStatus,
  type GeneralManagerEvaluation,
  type GeneralSecondInterviewScreeningStatus,
} from './volunteer-screening-constants'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  computeGeneralInterviewTotalScore,
  matchesGeneralInterview2ScoreFilter,
  resolveGeneralEffectiveSecondInterviewStatus,
} from './general-volunteer-interview2-display'

const ALL = 'ALL'
const FILTER_WIDTH = 260

const selectStyle = { width: FILTER_WIDTH } as const

const jaVolunteerExperienceOptions = [
  { label: '전체', value: ALL },
  { label: '있음', value: 'yes' },
  { label: '없음', value: 'no' },
]

const managerEvaluationOptions = [
  { label: '전체', value: ALL },
  ...GENERAL_MANAGER_EVALUATION_ORDER.map((value: GeneralManagerEvaluation) => ({
    label: GENERAL_MANAGER_EVALUATION_LABELS[value],
    value,
  })),
]

const screeningStatusOptions = [
  { label: '전체', value: ALL },
  ...(
    Object.entries(GENERAL_DOCUMENT_SCREENING_STATUS_LABELS) as [
      GeneralDocumentScreeningStatus,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

/** 면접 없음 목록 — 내부 값은 documentScreeningStatus, 라벨은 프로그램 승인 현황 */
const applicationApprovalStatusOptions = [
  { label: '전체', value: ALL },
  { label: APPROVAL_STATUS_LABELS.pending, value: 'pending' },
  { label: APPROVAL_STATUS_LABELS.approved, value: 'pass' },
  { label: APPROVAL_STATUS_LABELS.rejected, value: 'fail' },
]

const interviewAssignmentOptions = [
  { label: '전체', value: ALL },
  ...(
    Object.entries(GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS) as [
      GeneralInterviewAssignmentStatus,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

const secondInterviewStatusOptions = [
  { label: '전체', value: ALL },
  ...SECOND_INTERVIEW_SCREENING_STATUS_ORDER.map(
    (value: GeneralSecondInterviewScreeningStatus) => ({
      label: SECOND_INTERVIEW_SCREENING_STATUS_LABELS[value],
      value,
    })
  ),
  {
    label: GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS.withdrawn,
    value: 'withdrawn',
  },
]

const interview2ScoreOptions = [
  { label: '전체', value: ALL },
  ...Array.from({ length: 10 }, (_, index) => ({
    label: String(index + 1),
    value: String(index + 1),
  })),
  { label: '-', value: 'empty' },
]

export const GENERAL_VOLUNTEER_FILTER_ALL = ALL

/** 1차 서류 심사 대상자 — 기관 프로그램 5필터(1행) */
export type GeneralVolunteerDoc1Filters = {
  volunteerName: string
  jaVolunteerExperience: string
  managerAEvaluation: string
  managerBEvaluation: string
  documentScreeningStatus: string
}

export const DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS: GeneralVolunteerDoc1Filters = {
  volunteerName: '',
  jaVolunteerExperience: ALL,
  managerAEvaluation: ALL,
  managerBEvaluation: ALL,
  documentScreeningStatus: ALL,
}

export type GeneralVolunteerDocPassedFilters = {
  volunteerName: string
  interviewAssignmentStatus: string
}

export const DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS: GeneralVolunteerDocPassedFilters = {
  volunteerName: '',
  interviewAssignmentStatus: ALL,
}

export type GeneralVolunteerInterview2Filters = {
  volunteerName: string
  interviewDate: string
  interviewTime: string
  totalScore: string
  secondInterviewScreeningStatus: string
}

export const DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS: GeneralVolunteerInterview2Filters = {
  volunteerName: '',
  interviewDate: ALL,
  interviewTime: ALL,
  totalScore: ALL,
  secondInterviewScreeningStatus: ALL,
}

function buildGeneralFilterField(config: FilterFieldConfig): FilterFieldConfig {
  return {
    width: FILTER_WIDTH,
    style: config.type === 'select' ? selectStyle : undefined,
    ...config,
  }
}

export function buildGeneralVolunteerDoc1FilterFields(options?: {
  interviewEnabled?: boolean
}): FilterFieldConfig[] {
  return buildGeneralVolunteerDoc1FilterRows(options).flat()
}

export function buildGeneralVolunteerDoc1FilterRows(options?: {
  interviewEnabled?: boolean
}): FilterFieldConfig[][] {
  const interviewEnabled = options?.interviewEnabled !== false
  return [
    [
      buildGeneralFilterField({
        key: 'volunteerName',
        type: 'search',
        label: '신청 봉사자명',
        placeholder: '봉사자명을 입력해 주세요',
      }),
      ...(interviewEnabled
        ? [
            buildGeneralFilterField({
              key: 'jaVolunteerExperience',
              type: 'select',
              label: 'JA 봉사 진행 경험',
              placeholder: '전체',
              options: jaVolunteerExperienceOptions,
            }),
            buildGeneralFilterField({
              key: 'managerAEvaluation',
              type: 'select',
              label: '담당자 A 평가',
              placeholder: '전체',
              options: managerEvaluationOptions,
            }),
            buildGeneralFilterField({
              key: 'managerBEvaluation',
              type: 'select',
              label: '담당자 B 평가',
              placeholder: '전체',
              options: managerEvaluationOptions,
            }),
          ]
        : []),
      buildGeneralFilterField({
        key: 'documentScreeningStatus',
        type: 'select',
        label: interviewEnabled ? '1차 서류 심사 현황' : '프로그램 승인 현황',
        placeholder: '전체',
        options: interviewEnabled ? screeningStatusOptions : applicationApprovalStatusOptions,
      }),
    ],
  ]
}

export function filterGeneralDoc1Applicants(
  rows: GeneralVolunteerApplicantRow[],
  filters: GeneralVolunteerDoc1Filters
): GeneralVolunteerApplicantRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (filters.jaVolunteerExperience === 'yes' && !row.hasJaVolunteerExperience) return false
    if (filters.jaVolunteerExperience === 'no' && row.hasJaVolunteerExperience) return false
    if (
      filters.managerAEvaluation !== GENERAL_VOLUNTEER_FILTER_ALL &&
      row.managerAEvaluation !== filters.managerAEvaluation
    ) {
      return false
    }
    if (
      filters.managerBEvaluation !== GENERAL_VOLUNTEER_FILTER_ALL &&
      row.managerBEvaluation !== filters.managerBEvaluation
    ) {
      return false
    }
    if (
      filters.documentScreeningStatus !== GENERAL_VOLUNTEER_FILTER_ALL &&
      row.documentScreeningStatus !== filters.documentScreeningStatus
    ) {
      return false
    }
    return true
  })
}

export function buildGeneralVolunteerDocPassedFilterFields(
  subjectKind: ScreeningSubjectKind = 'volunteer'
): FilterFieldConfig[] {
  return buildGeneralVolunteerDocPassedFilterRows(subjectKind).flat()
}

export function buildGeneralVolunteerDocPassedFilterRows(
  subjectKind: ScreeningSubjectKind = 'volunteer'
): FilterFieldConfig[][] {
  return [
    [
      buildGeneralFilterField({
        key: 'volunteerName',
        type: 'search',
        label: screeningApplicantNameLabel(subjectKind),
        placeholder: screeningApplicantNamePlaceholder(subjectKind),
      }),
      buildGeneralFilterField({
        key: 'interviewAssignmentStatus',
        type: 'select',
        label: '면접일 배정 현황',
        placeholder: '전체',
        options: interviewAssignmentOptions,
      }),
    ],
  ]
}

export function buildGeneralVolunteerInterview2DateOptions(rows: GeneralVolunteerApplicantRow[]) {
  const dates = Array.from(
    new Set(rows.map(row => row.assignedInterviewDateLabel).filter((d): d is string => Boolean(d)))
  ).sort()
  return [{ label: '전체', value: ALL }, ...dates.map(d => ({ label: d, value: d }))]
}

export function buildGeneralVolunteerInterview2TimeOptions(rows: GeneralVolunteerApplicantRow[]) {
  const times = Array.from(
    new Set(rows.map(row => row.assignedInterviewTime).filter((t): t is string => Boolean(t)))
  ).sort()
  return [{ label: '전체', value: ALL }, ...times.map(t => ({ label: t, value: t }))]
}

export function buildGeneralVolunteerInterview2FilterFields(
  rows: GeneralVolunteerApplicantRow[],
  subjectKind: ScreeningSubjectKind = 'volunteer'
): FilterFieldConfig[] {
  return buildGeneralVolunteerInterview2FilterRows(rows, subjectKind).flat()
}

export function buildGeneralVolunteerInterview2FilterRows(
  rows: GeneralVolunteerApplicantRow[],
  subjectKind: ScreeningSubjectKind = 'volunteer'
): FilterFieldConfig[][] {
  const dateOptions = buildGeneralVolunteerInterview2DateOptions(rows)
  const timeOptions = buildGeneralVolunteerInterview2TimeOptions(rows)

  return [
    [
      buildGeneralFilterField({
        key: 'volunteerName',
        type: 'search',
        label: screeningApplicantNameLabel(subjectKind),
        placeholder: screeningApplicantNamePlaceholder(subjectKind),
      }),
      buildGeneralFilterField({
        key: 'interviewDate',
        type: 'select',
        label: '면접일',
        placeholder: '전체',
        options: dateOptions,
      }),
      buildGeneralFilterField({
        key: 'interviewTime',
        type: 'select',
        label: '면접 시간',
        placeholder: '전체',
        options: timeOptions,
      }),
      buildGeneralFilterField({
        key: 'totalScore',
        type: 'select',
        // 봉사자 시안 10-1(13050:741188)·개인 시안 03-1(4512:77300) 모두 「점수 총합」
        label: '점수 총합',
        placeholder: '전체',
        options: interview2ScoreOptions,
      }),
      buildGeneralFilterField({
        key: 'secondInterviewScreeningStatus',
        type: 'select',
        label: '2차 면접 심사 현황',
        placeholder: '전체',
        options: secondInterviewStatusOptions,
      }),
    ],
  ]
}

/** 2차 면접 대상자 캘린더 뷰 — 면접일 필드 제외, 점수 라벨 '점수 총합' */
export function buildGeneralVolunteerInterview2CalendarFilterFields(
  rows: GeneralVolunteerApplicantRow[],
  subjectKind: ScreeningSubjectKind = 'volunteer'
): FilterFieldConfig[] {
  return buildGeneralVolunteerInterview2CalendarFilterRows(rows, subjectKind).flat()
}

export function buildGeneralVolunteerInterview2CalendarFilterRows(
  rows: GeneralVolunteerApplicantRow[],
  subjectKind: ScreeningSubjectKind = 'volunteer'
): FilterFieldConfig[][] {
  const timeOptions = buildGeneralVolunteerInterview2TimeOptions(rows)

  return [
    [
      buildGeneralFilterField({
        key: 'volunteerName',
        type: 'search',
        label: screeningApplicantNameLabel(subjectKind),
        placeholder: screeningApplicantNamePlaceholder(subjectKind),
      }),
      buildGeneralFilterField({
        key: 'interviewTime',
        type: 'select',
        label: '면접 시간',
        placeholder: '전체',
        options: timeOptions,
      }),
      buildGeneralFilterField({
        key: 'totalScore',
        type: 'select',
        label: '점수 총합',
        placeholder: '전체',
        options: interview2ScoreOptions,
      }),
      buildGeneralFilterField({
        key: 'secondInterviewScreeningStatus',
        type: 'select',
        label: '2차 면접 심사 현황',
        placeholder: '전체',
        options: secondInterviewStatusOptions,
      }),
    ],
  ]
}

export function matchesGeneralInterviewSlotRange(count: number, filter: string): boolean {
  if (filter === ALL) return true
  if (filter === '0') return count === 0
  if (filter === '1') return count === 1
  if (filter === '2plus') return count >= 2
  return true
}

export function filterGeneralDocPassedApplicants(
  rows: GeneralVolunteerApplicantRow[],
  filters: GeneralVolunteerDocPassedFilters
): GeneralVolunteerApplicantRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (
      filters.interviewAssignmentStatus !== GENERAL_VOLUNTEER_FILTER_ALL &&
      row.interviewAssignmentStatus !== filters.interviewAssignmentStatus
    ) {
      return false
    }
    return true
  })
}

function filterGeneralInterview2ApplicantsBySharedFields(
  rows: GeneralVolunteerApplicantRow[],
  filters: GeneralVolunteerInterview2Filters,
  options?: { includeInterviewDate?: boolean }
): GeneralVolunteerApplicantRow[] {
  const includeInterviewDate = options?.includeInterviewDate ?? true
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (
      includeInterviewDate &&
      filters.interviewDate !== GENERAL_VOLUNTEER_FILTER_ALL &&
      row.assignedInterviewDateLabel !== filters.interviewDate
    ) {
      return false
    }
    if (
      filters.interviewTime !== GENERAL_VOLUNTEER_FILTER_ALL &&
      row.assignedInterviewTime !== filters.interviewTime
    ) {
      return false
    }
    if (
      !matchesGeneralInterview2ScoreFilter(
        computeGeneralInterviewTotalScore(row),
        filters.totalScore
      )
    ) {
      return false
    }
    if (filters.secondInterviewScreeningStatus !== GENERAL_VOLUNTEER_FILTER_ALL) {
      const effectiveStatus = resolveGeneralEffectiveSecondInterviewStatus(row)
      if (effectiveStatus !== filters.secondInterviewScreeningStatus) return false
    }
    return true
  })
}

export function filterGeneralInterview2Applicants(
  rows: GeneralVolunteerApplicantRow[],
  filters: GeneralVolunteerInterview2Filters
): GeneralVolunteerApplicantRow[] {
  return filterGeneralInterview2ApplicantsBySharedFields(rows, filters, {
    includeInterviewDate: true,
  })
}

/** remote 목록: 서버 query가 처리하므로 추가 클라이언트 필터 없음. */
export function filterGeneralInterview2ApplicantsRemoteClientOnly(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows
}

export function filterGeneralInterview2CalendarApplicants(
  rows: GeneralVolunteerApplicantRow[],
  filters: GeneralVolunteerInterview2Filters
): GeneralVolunteerApplicantRow[] {
  return filterGeneralInterview2ApplicantsBySharedFields(rows, filters, {
    includeInterviewDate: false,
  })
}
