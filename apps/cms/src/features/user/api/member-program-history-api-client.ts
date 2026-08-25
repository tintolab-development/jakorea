import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIMembersSubset } from '@/shared/api/generated/members/members-api'
import type { MemberLectureReportResponse } from '@/shared/api/generated/members/schemas/memberLectureReportResponse'
import customInstance from '@/shared/api/orval-mutator'
import type { BulkDownloadEndpointResponse } from '@/features/user/api/download-bulk-endpoint'

const membersApi = getJAKoreaCMSBackendAPIMembersSubset()

export interface MemberLectureAttendanceSessionResponse {
  roundNumber?: number
  status?: string
}

/** REQ-007 — GET .../applications/{applicationId}/lecture-attendance */
export interface MemberLectureAttendanceResponse {
  studentName?: string
  attendedCount?: number
  heldCount?: number
  sessions?: MemberLectureAttendanceSessionResponse[]
}

function memberApplicationUrl(memberId: number, applicationId: number): string {
  return `/api/admin/users/${memberId}/applications/${applicationId}`
}

export async function fetchApplicationLectureAttendanceRemote(
  memberId: number,
  applicationId: number
): Promise<MemberLectureAttendanceResponse> {
  return unwrapApiBody(
    await customInstance<MemberLectureAttendanceResponse>({
      url: `${memberApplicationUrl(memberId, applicationId)}/lecture-attendance`,
      method: 'GET',
    })
  )
}

export async function fetchMemberLectureReportsRemote(
  memberId: number,
  applicationId: number
): Promise<MemberLectureReportResponse[]> {
  const data = await unwrapApiBody(
    await membersApi.listLectureReports(memberId, applicationId)
  )
  return Array.isArray(data) ? data : []
}

/** REQ-011 — POST .../assignment-submissions/bulk-download */
export async function bulkDownloadMemberAssignmentSubmissionsRemote(
  memberId: number,
  applicationId: number,
  body: { submissionIds?: number[] } = {}
): Promise<BulkDownloadEndpointResponse> {
  return unwrapApiBody(
    await customInstance<BulkDownloadEndpointResponse>({
      url: `${memberApplicationUrl(memberId, applicationId)}/assignment-submissions/bulk-download`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

/** REQ-015 — POST .../lecture-reports/bulk-download */
export async function bulkDownloadMemberLectureReportsRemote(
  memberId: number,
  applicationId: number,
  body: { reportIds?: number[] } = {}
): Promise<BulkDownloadEndpointResponse> {
  return unwrapApiBody(
    await customInstance<BulkDownloadEndpointResponse>({
      url: `${memberApplicationUrl(memberId, applicationId)}/lecture-reports/bulk-download`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}
