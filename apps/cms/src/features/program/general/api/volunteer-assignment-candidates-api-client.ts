/**
 * 일반(기관형) 봉사자 — 면접 합격 시 기관 배정 후보 (BE A1)
 * GET /api/admin/programs/{programId}/volunteer-assignments/candidates (operationId listVolunteerAssignmentCandidates)
 * - GENERAL_ORGANIZATION 전용(그 외 400). 권한 ASSIGNMENT_READ + PROGRAM_VIEW
 * - 승인 기관 신청의 활성 기관 일정 배정 중 아직 시작하지 않은 회차만 — final-result `assignments[]`가 받는 조합
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { VolunteerAssignmentCandidateResponse } from '@/shared/api/generated/dashboard/schemas/volunteerAssignmentCandidateResponse'

export async function fetchVolunteerAssignmentCandidatesRemote(
  programId: string,
  signal?: AbortSignal
): Promise<VolunteerAssignmentCandidateResponse[]> {
  const body = unwrapApiBody<VolunteerAssignmentCandidateResponse[] | null>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/volunteer-assignments/candidates`,
      method: 'GET',
      signal,
    })
  )
  return Array.isArray(body) ? body : []
}
