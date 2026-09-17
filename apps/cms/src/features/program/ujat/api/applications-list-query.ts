/**
 * UJAT 신청 목록 UI 필터 → Admin applications list query
 * OpenAPI에 없는 필드(학년·희망지역·교육경험 등)는 호출부에서 클라이언트 필터 유지.
 */

import type { ApplicationsListQuery } from '@/features/program/general/api/applications-api-client'
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
  waiting: 'WAITING',
  completed: 'COMPLETED',
  reserve1: 'RESERVE',
  reserve2: 'RESERVE',
  reserve3: 'RESERVE',
  reserve4: 'RESERVE',
  withdrawn: 'WITHDRAWN',
}

const TEMP_ASSIGN_TO_ORG_STATUS: Record<string, string> = {
  evaluation_pending: 'PENDING',
  temp_assigned: 'TEMP_ASSIGNED',
  temp_rejected: 'TEMP_REJECTED',
  application_rejected: 'REJECTED',
}

function trimKeyword(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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

  return withRecruitHalf(
    {
      ...(keyword ? { keyword } : {}),
      ...(documentStatus ? { documentStatus } : {}),
      ...(managerAEvaluation ? { managerAEvaluation } : {}),
      ...(managerBEvaluation ? { managerBEvaluation } : {}),
      ...(isReparticipation != null ? { isReparticipation } : {}),
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

  return withRecruitHalf(
    {
      documentStatus: 'PASS',
      ...(keyword ? { keyword } : {}),
      ...(interviewStatus ? { interviewStatus } : {}),
    },
    half
  )
}

export function buildUjatVolunteerInterview2ListQuery(
  filters: UjatVolunteerInterview2Filters,
  half?: UjatVolunteerRecruitHalf | null
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const finalResultStatus =
    filters.secondInterviewScreeningStatus !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
    filters.secondInterviewScreeningStatus !== 'withdrawn'
      ? FINAL_STATUS_TO_API[filters.secondInterviewScreeningStatus]
      : undefined

  return withRecruitHalf(
    {
      documentStatus: 'PASS',
      ...(keyword ? { keyword } : {}),
      ...(finalResultStatus ? { finalResultStatus } : {}),
      ...(filters.secondInterviewScreeningStatus === 'withdrawn'
        ? { interviewStatus: 'WITHDRAWN' }
        : {}),
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

/** 기관 신청 — keyword/status + 선택적 recruitHalf(교육 진행 상·하반기) */
export function buildUjatInstitutionApplicationsListQuery(
  filters: UjatInstitutionApplicationFilters,
  half?: UjatVolunteerRecruitHalf | 'h1' | 'h2' | null
): ApplicationsListQuery {
  const keyword =
    trimKeyword(filters.institutionName) ?? trimKeyword(filters.teacherName) ?? undefined
  const status =
    filters.tempAssignmentStatus !== UJAT_INSTITUTION_APPLICATION_FILTER_ALL
      ? TEMP_ASSIGN_TO_ORG_STATUS[filters.tempAssignmentStatus]
      : undefined

  return withRecruitHalf(
    {
      ...(keyword ? { keyword } : {}),
      ...(status ? { status } : {}),
    },
    half
  )
}
