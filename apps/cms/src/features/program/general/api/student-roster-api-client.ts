/**
 * 기관 신청 학생 명단 Admin API
 * - GET   /api/admin/organization-applications/{applicationId}/student-roster
 * - PUT   /api/admin/organization-applications/{applicationId}/student-roster (수동 수정 — sourceFileObjectId 생략)
 * - POST  /api/admin/organization-applications/{applicationId}/student-roster/import
 * - POST  /api/admin/organization-applications/{applicationId}/student-roster/privacy-detail
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type {
  OrganizationStudentRosterImportRequest,
  OrganizationStudentRosterManualCommitRequest,
} from '@/features/program/general/api/student-roster-commit-types'
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

/** PUT — 관리자 수동 편집 전체 교체 (`expectedRevisionNo`, `rows`만 전송) */
export async function commitOrganizationStudentRosterRemote(
  applicationId: string | number,
  body: OrganizationStudentRosterManualCommitRequest
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

/** POST — 학생명단·출석 원문. 감사 사유는 서버 고정값이며 reason을 보내지 않는다. */
export async function fetchOrganizationStudentRosterPrivacyDetail(
  applicationId: string | number
): Promise<StudentRosterResponse> {
  return unwrapApiBody<StudentRosterResponse>(
    await customInstance({
      url: `${rosterUrl(applicationId)}/privacy-detail`,
      method: 'POST',
      headers: { 'Cache-Control': 'no-store' },
    })
  )
}

/** POST — Excel import (관리자 업로드 `sourceFileObjectId`만) */
export async function importOrganizationStudentRosterRemote(
  applicationId: string | number,
  body: OrganizationStudentRosterImportRequest
): Promise<StudentRosterResponse> {
  return unwrapApiBody<StudentRosterResponse>(
    await customInstance({
      url: `${rosterUrl(applicationId)}/import`,
      method: 'POST',
      data: body,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
