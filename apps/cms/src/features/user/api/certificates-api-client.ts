import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { customInstance } from '@/shared/api/orval-mutator'
import type { CertificateBulkIssueRequest } from '@/shared/api/generated/members/schemas/certificateBulkIssueRequest'
import type { BulkActionResponse } from '@/shared/api/generated/members/schemas/bulkActionResponse'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { axiosClient } from '@/shared/instance/axios-instance'
import { hydrateAxiosBlobError } from '@/shared/lib/admin-file-upload/attachments'

/** 일괄 발급·ZIP 공통 증명서 유형. 봉사자는 VOLUNTEER_ACTIVITY, 강사는 INSTRUCTOR_ACTIVITY. */
export type CertificateBulkType =
  | 'COMPLETION'
  | 'PARTICIPATION'
  | 'VOLUNTEER_ACTIVITY'
  | 'INSTRUCTOR_ACTIVITY'

/** Swagger `bulkIssue` — `POST /api/admin/certificates/issues/bulk` */
export async function bulkIssueCertificatesRemote(
  body: Omit<CertificateBulkIssueRequest, 'certificateType'> & { certificateType: CertificateBulkType }
): Promise<BulkActionResponse> {
  return unwrapApiBody(
    await customInstance<unknown>({
      url: '/api/admin/certificates/issues/bulk',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

/**
 * 일괄 발급 응답에서 발급된(이미 발급된 건 포함) participantId만 요청 순서대로 고른다.
 * 실패 건이 ZIP 대상이나 성공 건수에 섞이지 않게 한다.
 */
export function issuedParticipantIdsFromBulkResult(
  participantIds: readonly number[],
  result: BulkActionResponse
): number[] {
  const success = new Set(result.successIds ?? [])
  return participantIds.filter(id => success.has(id))
}

export type CertificateBulkDownloadZip = {
  zip: Blob
  /** 서버 저장 파일명 — `[JA Korea] 증명서_일괄_{YYMMDD}.zip` */
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
 * REQ-014 — 발급 후 ZIP 수령. `POST /api/admin/certificates/issues/bulk-download`
 * 서버는 ZIP 바이너리를 바로 내려준다(Content-Disposition = 규칙 파일명). 이미 발급된 건만 대상이며,
 * 이 엔드포인트는 `issueReason`을 쓰지 않는다. 오류 응답(JSON)은 blob으로 오므로 객체로 복원해 던진다.
 */
export async function bulkDownloadCertificatesRemote(body: {
  participantIds: number[]
  certificateType: CertificateBulkType
}): Promise<CertificateBulkDownloadZip> {
  let response: AxiosResponse<unknown>
  try {
    response = await axiosClient.request<unknown>({
      url: '/api/admin/certificates/issues/bulk-download',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/zip, application/json' },
      data: { participantIds: body.participantIds, certificateType: body.certificateType },
      responseType: 'blob',
      skipGlobalErrorAlert: true,
    } as AxiosRequestConfig & { skipGlobalErrorAlert: boolean })
  } catch (error) {
    throw await hydrateAxiosBlobError(error)
  }
  const payload = response.data
  if (!(payload instanceof Blob) || payload.size < 1 || payload.type.includes('json')) {
    throw new Error('증명서 ZIP을 받지 못했습니다.')
  }
  return { zip: payload, contentDisposition: readContentDisposition(response.headers) }
}
