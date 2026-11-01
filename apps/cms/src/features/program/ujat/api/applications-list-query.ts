/**
 * UJAT 신청 목록 UI 필터 → Admin applications list query
 * 서버 query가 없는 필드(면접 시간, 총점 「-」)만 호출부에서 클라이언트 필터.
 */

import type { UjatApplicationsListQuery as ApplicationsListQuery } from '@/features/program/ujat/api/ujat-applications-contract'
import type { UjatVolunteerDocScreeningFilters } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/doc-screening/filter-fields'
import { UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/doc-screening/filter-fields'
import type { UjatVolunteerDocPassedFilters } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/doc-passed/filter-fields'
import { UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/doc-passed/filter-fields'
import type { UjatVolunteerInterview2Filters } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview2/filter-fields'
import { UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview2/filter-fields'
import type { UjatInstitutionApplicationFilters } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import { UJAT_INSTITUTION_APPLICATION_FILTER_ALL } from '@/features/program/ujat/ui/detail-modal/application-institution/list/filter-fields'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { GENERAL_VOLUNTEER_INTERVIEW2_STAGE } from '@/features/program/general/api/volunteer-list-query'

export type UjatVolunteerApplicationsStage = 'doc1' | 'docPassed' | 'interview2'

const MANAGER_EVAL_TO_API: Record<string, string> = {
  pass: 'PASS',
  neutral: 'NEUTRAL',
  fail: 'FAIL',
  unreviewed: 'UNREVIEWED',
}

const DOC_STATUS_TO_API: Record<string, string> = {
  pass: 'PASS',
  fail: 'FAIL',
  pending: 'PENDING',
}

const INTERVIEW_ASSIGN_TO_API: Record<string, string> = {
  assigned: 'ASSIGNED',
  waiting: 'WAITING',
  withdrawn: 'WITHDRAWN',
}

const FINAL_STATUS_TO_API: Record<string, string> = {
  pass: 'PASS',
  fail: 'FAIL',
  reserve1: 'RESERVE',
  reserve2: 'RESERVE',
  reserve3: 'RESERVE',
  reserve4: 'RESERVE',
}

const EFFECTIVE_SECOND_INTERVIEW_STATUS_TO_API: Record<'waiting' | 'completed', string> = {
  waiting: 'WAITING',
  completed: 'COMPLETED',
}

const TEMP_ASSIGN_TO_APPLICATION_STATUS: Record<string, string> = {
  evaluation_pending: 'PENDING',
  application_rejected: 'REJECTED',
}

const TEMP_ASSIGN_TO_TEMPORARY_STATUS: Record<string, string> = {
  temp_assigned: 'TEMP_ASSIGNED',
  temp_rejected: 'TEMP_REJECTED',
}

function trimKeyword(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function selected(value: string | undefined, all: string): string | undefined {
  return value && value !== all ? value : undefined
}

/** 서버 허용값: 1~4학년 · 졸업 · 휴학 · 졸업유예 (그 외 400) */
function volunteerGradeQuery(value: string | undefined): string | undefined {
  if (value === '휴학생') return '휴학'
  return value
}

function educationExperienceQuery(value: string): { hasEducationExperience?: boolean } {
  if (value === 'yes') return { hasEducationExperience: true }
  if (value === 'no') return { hasEducationExperience: false }
  return {}
}

/** 목록 표시 `YYYY.MM.DD` → `YYYY-MM-DD` */
function interviewDateLabelToIso(label: string | undefined): string | undefined {
  const match = label?.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined
}

function numericFilter(value: string | undefined, all: string): number | undefined {
  const raw = selected(value, all)
  if (!raw) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

function withRecruitHalf(
  query: ApplicationsListQuery,
  half?: UjatVolunteerRecruitHalf | 'h1' | 'h2' | null
): ApplicationsListQuery {
  if (!half) return query
  return { ...query, recruitHalf: toUjatRecruitHalfApi(half) }
}

export function buildUjatVolunteerDoc1ListQuery(
  filters: UjatVolunteerDocScreeningFilters,
  half?: UjatVolunteerRecruitHalf | null
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const documentStatus =
    filters.documentScreeningStatus !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL
      ? DOC_STATUS_TO_API[filters.documentScreeningStatus]
      : undefined
  const managerAEvaluation =
    filters.managerAEvaluation !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL
      ? MANAGER_EVAL_TO_API[filters.managerAEvaluation]
      : undefined
  const managerBEvaluation =
    filters.managerBEvaluation !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL
      ? MANAGER_EVAL_TO_API[filters.managerBEvaluation]
      : undefined
  const isReparticipation =
    filters.applicationType === UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL
      ? undefined
      : filters.applicationType === 'ujat-graduate'

  const grade = volunteerGradeQuery(selected(filters.grade, UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL))
  const preferredRegion = selected(filters.preferredRegion, UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL)

  return withRecruitHalf(
    {
      ...(keyword ? { keyword } : {}),
      ...(documentStatus ? { documentStatus } : {}),
      ...(managerAEvaluation ? { managerAEvaluation } : {}),
      ...(managerBEvaluation ? { managerBEvaluation } : {}),
      ...(isReparticipation != null ? { isReparticipation } : {}),
      ...(grade ? { grade } : {}),
      ...(preferredRegion ? { preferredRegion } : {}),
      ...educationExperienceQuery(filters.educationExperience),
    },
    half
  )
}

export function buildUjatVolunteerDocPassedListQuery(
  filters: UjatVolunteerDocPassedFilters,
  half?: UjatVolunteerRecruitHalf | null
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const interviewStatus =
    filters.interviewAssignmentStatus !== UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL
      ? INTERVIEW_ASSIGN_TO_API[filters.interviewAssignmentStatus]
      : undefined

  const preferredRegion = selected(filters.preferredRegion, UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL)

  return withRecruitHalf(
    {
      documentStatus: 'PASS',
      ...(keyword ? { keyword } : {}),
      ...(interviewStatus ? { interviewStatus } : {}),
      ...(preferredRegion ? { preferredRegion } : {}),
      ...educationExperienceQuery(filters.educationExperience),
    },
    half
  )
}

export function buildUjatVolunteerInterview2ListQuery(
  filters: UjatVolunteerInterview2Filters,
  half?: UjatVolunteerRecruitHalf | null
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const status = filters.secondInterviewScreeningStatus
  const withdrawn = status === 'withdrawn'
  const effectiveSecondInterviewStatus =
    status === 'waiting' || status === 'completed'
      ? EFFECTIVE_SECOND_INTERVIEW_STATUS_TO_API[status]
      : undefined
  const finalResultStatus =
    status !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
    status !== 'withdrawn' &&
    status !== 'waiting' &&
    status !== 'completed'
      ? FINAL_STATUS_TO_API[status]
      : undefined

  const preferredRegion = selected(filters.preferredRegion, UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL)
  const assignedInterviewDate = interviewDateLabelToIso(
    selected(filters.interviewDate, UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL)
  )
  const totalScore = numericFilter(filters.totalScore, UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL)

  return withRecruitHalf(
    {
      documentStatus: 'PASS',
      ...(withdrawn
        ? { interviewStatus: 'WITHDRAWN' }
        : { interviewStage: GENERAL_VOLUNTEER_INTERVIEW2_STAGE }),
      ...(keyword ? { keyword } : {}),
      ...(effectiveSecondInterviewStatus ? { effectiveSecondInterviewStatus } : {}),
      ...(finalResultStatus ? { finalResultStatus } : {}),
      ...(preferredRegion ? { preferredRegion } : {}),
      ...(assignedInterviewDate ? { assignedInterviewDate } : {}),
      ...(totalScore != null ? { totalScore } : {}),
    },
    half
  )
}

export function buildUjatVolunteerStageBaseQuery(
  stage: UjatVolunteerApplicationsStage,
  half?: UjatVolunteerRecruitHalf | null
): ApplicationsListQuery {
  if (stage === 'docPassed' || stage === 'interview2') {
    return withRecruitHalf({ documentStatus: 'PASS' }, half)
  }
  return withRecruitHalf({}, half)
}

/** 기관 신청 — 기관명·교사명·학급 수·교육 지역·상태 + 선택적 recruitHalf */
export function buildUjatInstitutionApplicationsListQuery(
  filters: UjatInstitutionApplicationFilters,
  half?: UjatVolunteerRecruitHalf | 'h1' | 'h2' | null,
  options: { educationRegionCode?: string } = {}
): ApplicationsListQuery {
  const organizationName = trimKeyword(filters.institutionName)
  const teacherName = trimKeyword(filters.teacherName)
  const selectedStatus =
    filters.tempAssignmentStatus !== UJAT_INSTITUTION_APPLICATION_FILTER_ALL
      ? filters.tempAssignmentStatus
      : undefined
  const applicationStatus = selectedStatus
    ? TEMP_ASSIGN_TO_APPLICATION_STATUS[selectedStatus]
    : undefined
  const temporaryAssignmentStatus = selectedStatus
    ? TEMP_ASSIGN_TO_TEMPORARY_STATUS[selectedStatus]
    : undefined
  const totalClassCount = filters.totalClassCount.trim()
  const requestedClassCount =
    totalClassCount && Number.isInteger(Number(totalClassCount))
      ? Number(totalClassCount)
      : undefined

  return withRecruitHalf(
    {
      ...(organizationName ? { organizationName } : {}),
      ...(teacherName ? { teacherName } : {}),
      ...(applicationStatus ? { status: applicationStatus } : {}),
      ...(temporaryAssignmentStatus ? { temporaryAssignmentStatus } : {}),
      ...(requestedClassCount != null ? { requestedClassCount } : {}),
      ...(options.educationRegionCode
        ? { educationRegionCode: options.educationRegionCode }
        : {}),
    },
    half
  )
}
