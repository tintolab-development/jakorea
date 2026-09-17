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

export function buildUjatVolunteerDoc1ListQuery(
  filters: UjatVolunteerDocScreeningFilters
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

  return {
    ...(keyword ? { keyword } : {}),
    ...(documentStatus ? { documentStatus } : {}),
    ...(managerAEvaluation ? { managerAEvaluation } : {}),
    ...(managerBEvaluation ? { managerBEvaluation } : {}),
    ...(isReparticipation != null ? { isReparticipation } : {}),
  }
}

export function buildUjatVolunteerDocPassedListQuery(
  filters: UjatVolunteerDocPassedFilters
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const interviewStatus =
    filters.interviewAssignmentStatus !== UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL
      ? INTERVIEW_ASSIGN_TO_API[filters.interviewAssignmentStatus]
      : undefined

  return {
    documentStatus: 'PASS',
    ...(keyword ? { keyword } : {}),
    ...(interviewStatus ? { interviewStatus } : {}),
  }
}

export function buildUjatVolunteerInterview2ListQuery(
  filters: UjatVolunteerInterview2Filters
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const finalResultStatus =
    filters.secondInterviewScreeningStatus !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
    filters.secondInterviewScreeningStatus !== 'withdrawn'
      ? FINAL_STATUS_TO_API[filters.secondInterviewScreeningStatus]
      : undefined

  return {
    documentStatus: 'PASS',
    ...(keyword ? { keyword } : {}),
    ...(finalResultStatus ? { finalResultStatus } : {}),
    ...(filters.secondInterviewScreeningStatus === 'withdrawn'
      ? { interviewStatus: 'WITHDRAWN' }
      : {}),
  }
}

export function buildUjatVolunteerStageBaseQuery(
  stage: UjatVolunteerApplicationsStage
): ApplicationsListQuery {
  if (stage === 'docPassed' || stage === 'interview2') {
    return { documentStatus: 'PASS' }
  }
  return {}
}

/** 기관 신청 — OpenAPI에 명시된 list query가 빈약해 keyword/status만 전달 (미지원 시 BE가 무시) */
export function buildUjatInstitutionApplicationsListQuery(
  filters: UjatInstitutionApplicationFilters
): ApplicationsListQuery {
  const keyword =
    trimKeyword(filters.institutionName) ?? trimKeyword(filters.teacherName) ?? undefined
  const status =
    filters.tempAssignmentStatus !== UJAT_INSTITUTION_APPLICATION_FILTER_ALL
      ? TEMP_ASSIGN_TO_ORG_STATUS[filters.tempAssignmentStatus]
      : undefined

  return {
    ...(keyword ? { keyword } : {}),
    ...(status ? { status } : {}),
  }
}
