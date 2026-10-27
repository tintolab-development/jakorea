/**
 * 기관 신청 초상권 동의서 Admin API
 * - GET /api/admin/organization-applications/{applicationId}/portrait-consent
 *   제출이 없거나 업로드 취소된 경우 빈 본문 200 → null
 * - 파일은 PORTRAIT_CONSENT 민감 파일이므로 GET …/files/{id}/download 가 아니라
 *   claim+stream(`loadSensitiveAdminFileBlob`)으로 업로드 원본을 받는다.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { PortraitConsentResponse } from '@/shared/api/generated/dashboard/schemas/portraitConsentResponse'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { downloadBlob } from '@/shared/utils/file-download'

export const PORTRAIT_CONSENT_FILE_DOWNLOAD_REASON = '초상권 동의서 확인'

function portraitConsentUrl(applicationId: string | number): string {
  return `/api/admin/organization-applications/${encodeURIComponent(String(applicationId))}/portrait-consent`
}

function isPortraitConsentMissingError(error: unknown): boolean {
  const status = getApiErrorHttpStatus(error)
  if (status === 404) return true
  return getApiErrorCode(error) === 'PORTRAIT_CONSENT_NOT_FOUND'
}

export async function fetchOrganizationPortraitConsentRemote(
  applicationId: string | number
): Promise<PortraitConsentResponse | null> {
  let payload: unknown
  try {
    payload = await customInstance<unknown>(
      {
        url: portraitConsentUrl(applicationId),
        method: 'GET',
      },
      { skipGlobalErrorAlert: true }
    )
  } catch (error) {
    if (isPortraitConsentMissingError(error)) return null
    throw error
  }
  const body = unwrapApiBody<PortraitConsentResponse | null | undefined>(payload)
  if (body == null || typeof body !== 'object') return null
  if (Object.keys(body).length === 0) return null
  return body
}

/** 교사가 올린 원본 파일을 민감 파일 relay로 저장한다. PDF 재발급이 아니다. */
export async function downloadOrganizationPortraitConsentFile(input: {
  fileObjectId: number
  fileName: string
}): Promise<void> {
  const blob = await loadSensitiveAdminFileBlob({
    fileObjectId: input.fileObjectId,
    reason: PORTRAIT_CONSENT_FILE_DOWNLOAD_REASON,
  })
  await downloadBlob(blob, input.fileName.trim() || '초상권동의서')
}
