import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { customInstance } from '@/shared/api/orval-mutator'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import {
  isAllowedCertificateSerialType,
  parseCertificateSerialInt64,
  parseIssuedCertificateSerial,
  type CertificateSerialSubject,
} from '@/features/program/shared/lib/certificate-serial'

export type CertificateSerialAllocateResponse = {
  serialNumber: string
  issueId?: number
  reused?: boolean
}

export const CERTIFICATE_SERIAL_ALLOCATE_FALLBACK =
  '고유번호를 발급하지 못했습니다. PDF를 생성하지 않았습니다.'

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
 * 같은 프로그램·대상·유형이면 기존 번호를 반환하고, 없으면 DB에서 다음 일련번호를 확정한다.
 * mock / 404·501 폴백 없이 실 API만 호출한다. 실패 시 throw — 호출부는 PDF를 만들지 않는다.
 */
export async function allocateCertificateSerial(
  subject: CertificateSerialSubject
): Promise<CertificateSerialAllocateResponse> {
  const programId = parseCertificateSerialInt64(subject.programId)
  const participantId = parseCertificateSerialInt64(subject.subjectId)
  if (programId == null) {
    throw new CertificateSerialAllocateError('프로그램 정보가 없어 고유번호를 발급할 수 없습니다.')
  }
  if (participantId == null) {
    throw new CertificateSerialAllocateError('참가자 정보가 없어 고유번호를 발급할 수 없습니다.')
  }
  if (!isAllowedCertificateSerialType(subject.certificateType)) {
    throw new CertificateSerialAllocateError('지원하지 않는 인증서 유형입니다.')
  }

  const body = await unwrapApiBody<unknown>(
    await customInstance<unknown>(
      {
        url: '/api/admin/certificates/issues/serial',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          programId,
          participantId,
          certificateType: subject.certificateType,
        },
      },
      { skipGlobalErrorAlert: true }
    )
  )

  const serialNumber = parseIssuedCertificateSerial(
    body != null && typeof body === 'object'
      ? (body as { serialNumber?: unknown }).serialNumber
      : null
  )
  if (serialNumber == null) {
    throw new CertificateSerialAllocateError('고유번호 응답이 올바르지 않습니다.')
  }

  const issueId = (body as { issueId?: unknown }).issueId
  const reused = (body as { reused?: unknown }).reused
  return {
    serialNumber,
    ...(typeof issueId === 'number' ? { issueId } : {}),
    ...(typeof reused === 'boolean' ? { reused } : {}),
  }
}
