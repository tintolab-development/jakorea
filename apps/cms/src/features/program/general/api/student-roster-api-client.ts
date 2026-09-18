/**
 * 기관 신청 학생 명단 Admin API
 * - GET  /api/admin/organization-applications/{applicationId}/student-roster
 * - PUT  /api/admin/organization-applications/{applicationId}/student-roster
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { StudentRosterCommitRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterCommitRequest'
import type { StudentRosterResponse } from '@/shared/api/generated/dashboard/schemas/studentRosterResponse'

function rosterUrl(applicationId: string | number): string {
  return `/api/admin/organization-applications/${encodeURIComponent(String(applicationId))}/student-roster`
}

/** GET — 기관 신청 학생명단 조회 */
export async function fetchOrganizationStudentRosterRemote(
  applicationId: string | number
): Promise<StudentRosterResponse> {
  return unwrapApiBody<StudentRosterResponse>(
    await customInstance({
      url: rosterUrl(applicationId),
      method: 'GET',
    })
  )
}

/**
 * PUT — 기관 신청 학생명단 전체 교체.
 * OpenAPI상 `sourceFileObjectId` 필수 — 수동 편집 시 직전 GET 값 또는 0을 전달하고,
 * 서버가 optional 허용하도록 계약 보완이 필요하다.
 */
export async function commitOrganizationStudentRosterRemote(
  applicationId: string | number,
  body: StudentRosterCommitRequest
): Promise<StudentRosterResponse> {
  return unwrapApiBody<StudentRosterResponse>(
    await customInstance({
      url: rosterUrl(applicationId),
      method: 'PUT',
      data: body,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
