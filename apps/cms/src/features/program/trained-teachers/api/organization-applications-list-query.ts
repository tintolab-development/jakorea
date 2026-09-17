/**
 * TT 기관 신청 UI 필터 → list query
 * OpenAPI에 명시된 query가 빈약해 keyword/status만 전달 (미지원 시 BE가 무시).
 * 소재지·학년 등은 호출부에서 클라이언트 보강 필터 유지.
 */

import { mapApprovalStatusToApiFilter } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { ApplicantApprovalStatusKey } from '@/features/program/shared/model/applicant-institution'

export type TrainedTeacherOrganizationApplicationsListQuery = {
  keyword?: string
  status?: string
}

export type TrainedTeacherOrganizationApplicationUiFilters = {
  organizationName?: unknown
  teacherName?: unknown
  approvalStatus?: unknown
  /** 진행 현황 참여 기관명 */
  schoolName?: unknown
}

function trimKeyword(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function normalizeApprovalStatus(value: unknown): ApplicantApprovalStatusKey | undefined {
  if (value == null || value === '' || value === 'all') return undefined
  if (value === 'pending' || value === 'approved' || value === 'rejected') {
    return value
  }
  return undefined
}

/** 기관 신청 목록 — 조회 시 API에 실을 query */
export function buildTrainedTeacherOrganizationApplicationsListQuery(
  filters: TrainedTeacherOrganizationApplicationUiFilters = {}
): TrainedTeacherOrganizationApplicationsListQuery {
  const keyword =
    trimKeyword(filters.organizationName) ??
    trimKeyword(filters.schoolName) ??
    trimKeyword(filters.teacherName)
  const status = mapApprovalStatusToApiFilter(normalizeApprovalStatus(filters.approvalStatus))

  return {
    ...(keyword ? { keyword } : {}),
    ...(status ? { status } : {}),
  }
}

/** 진행 현황 참여 기관 — 승인 건만 + keyword */
export function buildTrainedTeacherParticipatingInstitutionsListQuery(
  filters: TrainedTeacherOrganizationApplicationUiFilters = {}
): TrainedTeacherOrganizationApplicationsListQuery {
  const keyword =
    trimKeyword(filters.schoolName) ??
    trimKeyword(filters.organizationName) ??
    trimKeyword(filters.teacherName)

  return {
    status: 'APPROVED',
    ...(keyword ? { keyword } : {}),
  }
}

export function serializeTrainedTeacherOrganizationApplicationsListQuery(
  query: TrainedTeacherOrganizationApplicationsListQuery
): string {
  return JSON.stringify({
    keyword: query.keyword ?? '',
    status: query.status ?? '',
  })
}
