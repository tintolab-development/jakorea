import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { customInstance } from '@/shared/api/orval-mutator'
import type { CertificateEligibilityResponse } from '@/shared/api/generated/forms-surveys/schemas/certificateEligibilityResponse'
import { getJAKoreaCMSBackendAPICertificatesSubset } from '@/shared/api/generated/certificates/certificates-api'
import type { CertificateDownloadLogRequest } from '@/shared/api/generated/certificates/schemas/certificateDownloadLogRequest'
import type { CertificateDownloadLogResponse } from '@/shared/api/generated/certificates/schemas/certificateDownloadLogResponse'
import type { CertificateSerialAllocateRequest } from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateRequest'
import type { CertificateSerialAllocateResponse } from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateResponse'
import { getJAKoreaCMSBackendAPIMembersSubset } from '@/shared/api/generated/members/members-api'
import type { CertificateRosterSerialAllocateRequest } from '@/shared/api/generated/members/schemas/certificateRosterSerialAllocateRequest'
import {
  extractApiErrorCode,
  extractApiErrorMessage,
} from '@/shared/lib/extract-api-error-message'
import {
  CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE,
  CERTIFICATE_SERIAL_ISSUANCE_PROGRAM,
  isAllowedCertificateSerialType,
  isFormTemplateCertificateSerialSubject,
  isRosterCertificateSerialSubject,
  normalizeCertificateIssueReasonCode,
  parseCertificateIssueId,
  parseCertificateSerialInt64,
  parseIssuedCertificateSerial,
  type CertificateSerialSubject,
} from '@/features/program/shared/lib/certificate-serial'
import {
  CERTIFICATE_ELIGIBILITY_TYPE_COMPLETION,
  CERTIFICATE_ELIGIBILITY_TYPE_PARTICIPATION,
  selectIssuableCertificatePlan,
  type CertificateIssuePlan,
  messageForCertificateReasonCode,
} from '@/features/program/shared/lib/certificate-eligibility'

const certificatesApi = getJAKoreaCMSBackendAPICertificatesSubset()
const membersApi = getJAKoreaCMSBackendAPIMembersSubset()

export type { CertificateSerialAllocateRequest, CertificateSerialAllocateResponse }

export const CERTIFICATE_SERIAL_ALLOCATE_FALLBACK =
  '고유번호를 발급하지 못했습니다. PDF를 생성하지 않았습니다.'

export const CERTIFICATE_DOWNLOAD_LOG_FALLBACK =
  '파일 다운로드 이력을 기록하지 못했습니다. PDF를 생성하지 않았습니다.'

export const CERTIFICATE_ELIGIBILITY_FETCH_FALLBACK =
  '수료증/참가인증서 발급 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'

export function getCertificateEligibilityErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    const code = extractApiErrorCode(axiosErr.response?.data)
    const consentMessage = messageForCertificateReasonCode(code)
    const extracted = extractApiErrorMessage(axiosErr.response?.data, {
      httpStatus: axiosErr.response?.status,
      fallback: CERTIFICATE_ELIGIBILITY_FETCH_FALLBACK,
    })
    if (consentMessage && (!extracted || extracted === code)) return consentMessage
    return extracted
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return CERTIFICATE_ELIGIBILITY_FETCH_FALLBACK
}

/** `GET /api/admin/certificates/eligibility` */
export async function fetchCertificateEligibility(params: {
  participantId: number
  certificateType?: string
}): Promise<CertificateEligibilityResponse> {
  return unwrapApiBody(
    await customInstance<unknown>(
      {
        url: '/api/admin/certificates/eligibility',
        method: 'GET',
        params: {
          participantId: params.participantId,
          certificateType: params.certificateType ?? CERTIFICATE_ELIGIBILITY_TYPE_COMPLETION,
        },
      },
      { skipGlobalErrorAlert: true }
    )
  )
}

export async function resolveCertificateIssuePlan(params: {
  participantId: string | number | null | undefined
  activityWithdrawn?: boolean
}): Promise<CertificateIssuePlan | null> {
  const parsed = parseCertificateSerialInt64(params.participantId)
  if (parsed == null) return null
  const [completion, participation] = await Promise.all([
    fetchCertificateEligibility({
      participantId: parsed,
      certificateType: CERTIFICATE_ELIGIBILITY_TYPE_COMPLETION,
    }),
    fetchCertificateEligibility({
      participantId: parsed,
      certificateType: CERTIFICATE_ELIGIBILITY_TYPE_PARTICIPATION,
    }),
  ])
  return selectIssuableCertificatePlan({
    activityWithdrawn: params.activityWithdrawn === true,
    completion,
    participation,
  })
}

/**
 * 발급 CTA 전 서버 eligibility만 본다. 수료증이 막혀도 참가인증서가 허용되면 통과한다.
 * participantId를 파싱할 수 없으면 조회를 건너뛴다(발급 API 409에 맡김).
 */
export async function resolveCertificateIssuePrecheckMessage(
  participantId: string | number | null | undefined,
  options?: { activityWithdrawn?: boolean }
): Promise<string | null> {
  const plan = await resolveCertificateIssuePlan({
    participantId,
    activityWithdrawn: options?.activityWithdrawn,
  })
  if (plan == null) return null
  return plan.eligible ? null : plan.blockMessage
}

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
    const code = extractApiErrorCode(data)
    const consentMessage = messageForCertificateReasonCode(code)
    if (data != null && typeof data === 'object') {
      const envelope = data as {
        message?: unknown
        error?: { message?: unknown; code?: unknown }
      }
      const nested =
        typeof envelope.error?.message === 'string' ? envelope.error.message.trim() : ''
      const top = typeof envelope.message === 'string' ? envelope.message.trim() : ''
      const serverText = nested || top
      if (consentMessage && (!serverText || serverText === code)) {
        return consentMessage
      }
      if (serverText) return serverText
    }
    if (consentMessage) return consentMessage
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
 * 서버는 호출마다 새 번호를 발급하므로 `reused`는 하위 호환 필드로만 전달하며,
 * 발급 또는 PDF 생성 여부를 결정하는 데 사용하지 않는다. 정상 응답에서는 false다.
 */
/** 발급 사유 `issueReason`은 생성 타입 `CertificateSerialAllocateRequest`의 옵셔널 필드다. */
export type CertificateSerialAllocateRequestWithReason = CertificateSerialAllocateRequest

export function buildCertificateSerialAllocateRequest(
  subject: CertificateSerialSubject
): CertificateSerialAllocateRequestWithReason {
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

  const issueReason = normalizeCertificateIssueReasonCode(subject.issueReason)
  return {
    programId,
    participantId,
    certificateType: subject.certificateType,
    issuanceSource: CERTIFICATE_SERIAL_ISSUANCE_PROGRAM,
    ...(issueReason ? { issueReason } : {}),
  }
}

export function buildCertificateRosterSerialAllocateRequest(
  subject: CertificateSerialSubject
): CertificateRosterSerialAllocateRequest {
  if (!isAllowedCertificateSerialType(subject.certificateType)) {
    throw new CertificateSerialAllocateError('지원하지 않는 인증서 유형입니다.')
  }

  const programId = parseCertificateSerialInt64(subject.programId)
  const applicationId = parseCertificateSerialInt64(subject.applicationId)
  const rosterId = parseCertificateSerialInt64(subject.rosterId)
  if (programId == null) {
    throw new CertificateSerialAllocateError('프로그램 정보가 없어 고유번호를 발급할 수 없습니다.')
  }
  if (applicationId == null) {
    throw new CertificateSerialAllocateError('기관 신청 정보가 없어 고유번호를 발급할 수 없습니다.')
  }
  if (rosterId == null) {
    throw new CertificateSerialAllocateError('학생 명단 정보가 없어 고유번호를 발급할 수 없습니다.')
  }

  return {
    programId,
    applicationId,
    rosterId,
    certificateType: subject.certificateType as CertificateRosterSerialAllocateRequest['certificateType'],
  }
}

export async function allocateCertificateSerial(
  subject: CertificateSerialSubject
): Promise<CertificateSerialAllocateResponse & { serialNumber: string; issueId: number }> {
  const body = isRosterCertificateSerialSubject(subject)
    ? unwrapApiBody<CertificateSerialAllocateResponse>(
        await membersApi.allocateCertificateSerialByRoster(
          buildCertificateRosterSerialAllocateRequest(subject),
          { skipGlobalErrorAlert: true }
        )
      )
    : unwrapApiBody<CertificateSerialAllocateResponse>(
        await certificatesApi.allocateCertificateSerial(
          buildCertificateSerialAllocateRequest(subject),
          { skipGlobalErrorAlert: true }
        )
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
    reused: typeof body?.reused === 'boolean' ? body.reused : false,
    // 발급 일시(재요청이면 최초 발급 일시). PDF 발급일·파일명 날짜에 쓴다. 없으면 호출부가 오늘 날짜를 쓴다.
    issuedAt: typeof body?.issuedAt === 'string' ? body.issuedAt : null,
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
