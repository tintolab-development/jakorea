import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIMembersSubset } from '@/shared/api/generated/members/members-api'
import type { MemberLectureReportResponse } from '@/shared/api/generated/members/schemas/memberLectureReportResponse'
import type { FormSubmissionFileDownloadResponse } from '@/shared/api/generated/forms-surveys/schemas/formSubmissionFileDownloadResponse'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import customInstance from '@/shared/api/orval-mutator'
import { axiosClient } from '@/shared/instance/axios-instance'
import { hydrateAxiosBlobError } from '@/shared/lib/admin-file-upload/attachments'
import {
  extractApiErrorDetails,
  extractApiErrorMessage,
} from '@/shared/lib/extract-api-error-message'
import {
  downloadFromBulkEndpoint,
  type BulkDownloadEndpointResponse,
} from '@/features/user/api/download-bulk-endpoint'

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

export type MemberApplicationType = 'INDIVIDUAL' | 'VOLUNTEER' | 'INSTRUCTOR' | 'ORGANIZATION'

export type MemberApplicationAssignmentFilesZip = {
  zip: Blob
  /** 응답 `Content-Disposition` 원문. 없으면 null. */
  contentDisposition: string | null
}

function readContentDisposition(headers: unknown): string | null {
  if (!headers || typeof headers !== 'object') return null
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() !== 'content-disposition') continue
    return typeof value === 'string' && value.trim() ? value : null
  }
  return null
}

/**
 * POST .../assignment-files/download — 서버가 신청 건의 현재 과제 제출 파일을 재조회해 ZIP으로 내려준다.
 * 저장 파일명(`Content-Disposition`)이 필요해 생성 클라이언트 대신 응답 전체를 받는다.
 * 오류 응답(JSON)은 blob으로 오므로 `error.response.data`를 객체로 복원해 던진다.
 */
export async function downloadMemberApplicationAssignmentFilesZipRemote(input: {
  memberId: number
  applicationId: number
  applicationType: MemberApplicationType
}): Promise<MemberApplicationAssignmentFilesZip> {
  let response: AxiosResponse<unknown>
  try {
    response = await axiosClient.request<unknown>({
      url: `${memberApplicationUrl(input.memberId, input.applicationId)}/assignment-files/download`,
      method: 'POST',
      params: { applicationType: input.applicationType },
      headers: { Accept: 'application/zip, application/json' },
      responseType: 'blob',
      skipGlobalErrorAlert: true,
    } as AxiosRequestConfig & { skipGlobalErrorAlert: boolean })
  } catch (error) {
    throw await hydrateAxiosBlobError(error)
  }
  const payload = response.data
  if (!(payload instanceof Blob) || payload.size < 1 || payload.type.includes('json')) {
    throw new Error('과제 파일 ZIP을 받지 못했습니다.')
  }
  return { zip: payload, contentDisposition: readContentDisposition(response.headers) }
}

const ASSIGNMENT_FILES_DOWNLOAD_FALLBACK_MESSAGE =
  '과제 일괄 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'

/**
 * 과제 ZIP 오류 안내 — `error.details`의 회차·일정·파일명을 서버 message 앞에 붙인다.
 * 키가 없으면 해당 조각을 생략하고, details가 없으면 message만 쓴다.
 */
export function formatAssignmentFilesDownloadErrorMessage(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: unknown } } | null)?.response
  if (!response) {
    return error instanceof Error && error.message.trim()
      ? error.message.trim()
      : ASSIGNMENT_FILES_DOWNLOAD_FALLBACK_MESSAGE
  }
  const message = extractApiErrorMessage(response.data, {
    httpStatus: response.status,
    fallback: ASSIGNMENT_FILES_DOWNLOAD_FALLBACK_MESSAGE,
  })
  const details = extractApiErrorDetails(response.data)
  const sessionNo = details.sessionNo?.trim()
  const scheduleName = details.scheduleName?.trim()
  const originalFileName = details.originalFileName?.trim()
  const location = [
    sessionNo ? `${sessionNo}회차` : null,
    scheduleName ? `(${scheduleName})` : null,
    originalFileName ? `'${originalFileName}'` : null,
  ]
    .filter(Boolean)
    .join(' ')
  return location ? `${location} — ${message}` : message
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

/** PH-015 / REQ-010 — 단건 제출 파일 (과제·강의보고서 공통 후보) */
export async function downloadFormSubmissionFileRemote(
  submissionFileId: number,
  filenamePrefix: string
): Promise<void> {
  const data = await unwrapApiBody<FormSubmissionFileDownloadResponse>(
    await customInstance<FormSubmissionFileDownloadResponse>({
      url: `/api/admin/form-submission-files/${submissionFileId}/download`,
      method: 'GET',
    })
  )
  if (data.downloadEndpoint) {
    await downloadFromBulkEndpoint(data.downloadEndpoint, filenamePrefix)
    return
  }
  throw new Error('다운로드 URL이 없습니다.')
}

/** PH-015 — GET .../lecture-reports/{reportId}/download (BE 미구현 시 404) */
export async function downloadMemberLectureReportRemote(
  memberId: number,
  applicationId: number,
  reportId: number,
  filenamePrefix: string
): Promise<void> {
  const data = await unwrapApiBody<{ downloadEndpoint?: string }>(
    await customInstance<{ downloadEndpoint?: string }>({
      url: `${memberApplicationUrl(memberId, applicationId)}/lecture-reports/${reportId}/download`,
      method: 'GET',
    })
  )
  if (data.downloadEndpoint) {
    await downloadFromBulkEndpoint(data.downloadEndpoint, filenamePrefix, 'pdf')
    return
  }
  throw new Error('다운로드 URL이 없습니다.')
}
