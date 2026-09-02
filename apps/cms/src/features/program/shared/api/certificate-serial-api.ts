import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPICertificatesSubset } from '@/shared/api/generated/certificates/certificates-api'
import type { CertificateDownloadLogRequest } from '@/shared/api/generated/certificates/schemas/certificateDownloadLogRequest'
import type { CertificateDownloadLogResponse } from '@/shared/api/generated/certificates/schemas/certificateDownloadLogResponse'
import type { CertificateSerialAllocateRequest } from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateRequest'
import type { CertificateSerialAllocateResponse } from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateResponse'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import {
  CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE,
  CERTIFICATE_SERIAL_ISSUANCE_PROGRAM,
  isAllowedCertificateSerialType,
  isFormTemplateCertificateSerialSubject,
  parseCertificateIssueId,
  parseCertificateSerialInt64,
  parseIssuedCertificateSerial,
  type CertificateSerialSubject,
} from '@/features/program/shared/lib/certificate-serial'

const certificatesApi = getJAKoreaCMSBackendAPICertificatesSubset()

export type { CertificateSerialAllocateRequest, CertificateSerialAllocateResponse }

export const CERTIFICATE_SERIAL_ALLOCATE_FALLBACK =
  '고유번호를 발급하지 못했습니다. PDF를 생성하지 않았습니다.'

export const CERTIFICATE_DOWNLOAD_LOG_FALLBACK =
  '파일 다운로드 이력을 기록하지 못했습니다. PDF를 생성하지 않았습니다.'

export class CertificateSerialAllocateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CertificateSerialAllocateError'
  }
}

export function getCertificateSerialAllocateErrorMessage(error: unknown): string {
  if (error instanceof CertificateSerialAllocateError && error.message.trim()) {
    return error.message
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    const data = axiosErr.response?.data
    if (data != null && typeof data === 'object') {
      const envelope = data as {
        message?: unknown
        error?: { message?: unknown }
      }
      const nested =
        typeof envelope.error?.message === 'string' ? envelope.error.message.trim() : ''
      if (nested) return nested
      const top = typeof envelope.message === 'string' ? envelope.message.trim() : ''
      if (top) return top
    }
    return extractApiErrorMessage(axiosErr.response?.data, {
      httpStatus: axiosErr.response?.status,
      fallback: CERTIFICATE_SERIAL_ALLOCATE_FALLBACK,
    })
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return CERTIFICATE_SERIAL_ALLOCATE_FALLBACK
}

/**
 * `POST /api/admin/certificates/issues/serial` (`allocateCertificateSerial`).
 * mock / 404·501 폴백 없이 실 API만 호출한다. 실패 시 throw — 호출부는 PDF를 만들지 않는다.
 * `reused: true`여도 정상 반환한다.
 */
export function buildCertificateSerialAllocateRequest(
  subject: CertificateSerialSubject
): CertificateSerialAllocateRequest {
  if (!isAllowedCertificateSerialType(subject.certificateType)) {
    throw new CertificateSerialAllocateError('지원하지 않는 인증서 유형입니다.')
  }

  if (isFormTemplateCertificateSerialSubject(subject)) {
    return {
      certificateType: subject.certificateType,
      issuanceSource: CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE,
    }
  }

  const programId = parseCertificateSerialInt64(subject.programId)
  const participantId = parseCertificateSerialInt64(subject.subjectId)
  if (programId == null) {
    throw new CertificateSerialAllocateError('프로그램 정보가 없어 고유번호를 발급할 수 없습니다.')
  }
  if (participantId == null) {
    throw new CertificateSerialAllocateError('참가자 정보가 없어 고유번호를 발급할 수 없습니다.')
  }

  return {
    programId,
    participantId,
    certificateType: subject.certificateType,
    issuanceSource: CERTIFICATE_SERIAL_ISSUANCE_PROGRAM,
  }
}

export async function allocateCertificateSerial(
  subject: CertificateSerialSubject
): Promise<CertificateSerialAllocateResponse & { serialNumber: string; issueId: number }> {
  const request = buildCertificateSerialAllocateRequest(subject)

  const body = unwrapApiBody<CertificateSerialAllocateResponse>(
    await certificatesApi.allocateCertificateSerial(request, { skipGlobalErrorAlert: true })
  )

  const serialNumber = parseIssuedCertificateSerial(body?.serialNumber)
  if (serialNumber == null) {
    throw new CertificateSerialAllocateError('고유번호 응답이 올바르지 않습니다.')
  }

  const issueId = parseCertificateIssueId(body?.issueId)
  if (issueId == null) {
    throw new CertificateSerialAllocateError('발급 이력을 기록할 수 없습니다.')
  }

  return {
    serialNumber,
    issueId,
    ...(typeof body?.reused === 'boolean' ? { reused: body.reused } : {}),
  }
}

/**
 * `POST /api/admin/certificates/issues/{issueId}/download-logs` (`logDownload`).
 * 파일 저장 직전에 호출한다. 실패 시 throw — 호출부는 PDF를 저장하지 않는다.
 * CMS는 `POST /api/admin/logs/file-access` 를 호출하지 않는다.
 */
export async function logCertificateIssueDownload(
  issueId: number,
  options: { fileName: string }
): Promise<void> {
  const parsedIssueId = parseCertificateIssueId(issueId)
  const fileName = options.fileName.trim()
  if (parsedIssueId == null || fileName === '') {
    throw new CertificateSerialAllocateError(CERTIFICATE_DOWNLOAD_LOG_FALLBACK)
  }

  const request: CertificateDownloadLogRequest = {
    fileName,
    ...(typeof navigator !== 'undefined' && navigator.userAgent
      ? { userAgent: navigator.userAgent }
      : {}),
  }

  try {
    unwrapApiBody<CertificateDownloadLogResponse>(
      await certificatesApi.logDownload(parsedIssueId, request, { skipGlobalErrorAlert: true })
    )
  } catch (error) {
    throw new CertificateSerialAllocateError(getCertificateSerialAllocateErrorMessage(error))
  }
}
