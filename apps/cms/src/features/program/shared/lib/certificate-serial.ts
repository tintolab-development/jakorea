import {
  CertificateSerialAllocateRequestCertificateType,
} from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateRequestCertificateType'
import { CertificateSerialAllocateRequestIssuanceSource } from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateRequestIssuanceSource'

/** 양식 관리 미리보기 전용. 실제 발급 번호가 아님. API에 보내거나 성공 응답으로 쓰지 않는다. */
export const CERTIFICATE_SERIAL_PLACEHOLDER = '26-JA-00000'

export const CERTIFICATE_SERIAL_PATTERN = /^\d{2}-JA-\d{5}$/

export const CERTIFICATE_SERIAL_TYPES = Object.values(
  CertificateSerialAllocateRequestCertificateType
) as CertificateSerialType[]

export type CertificateSerialType = CertificateSerialAllocateRequestCertificateType

export function isCertificateSerialPlaceholder(value: string | null | undefined): boolean {
  return value == null || value.trim() === '' || value.trim() === CERTIFICATE_SERIAL_PLACEHOLDER
}

export function isIssuedCertificateSerial(value: string): boolean {
  return CERTIFICATE_SERIAL_PATTERN.test(value) && !isCertificateSerialPlaceholder(value)
}

export function parseIssuedCertificateSerial(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return isIssuedCertificateSerial(trimmed) ? trimmed : null
}

export function isAllowedCertificateSerialType(value: string): value is CertificateSerialType {
  return (CERTIFICATE_SERIAL_TYPES as readonly string[]).includes(value)
}

/** BE int64. 양의 정수만 허용. mock 문자열 id는 null */
export function parseCertificateSerialInt64(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) return null
    return value
  }
  const trimmed = String(value).trim()
  if (!/^\d+$/.test(trimmed)) return null
  const n = Number(trimmed)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

export function parseCertificateIssueId(value: unknown): number | null {
  if (typeof value === 'number' || typeof value === 'string') {
    return parseCertificateSerialInt64(value)
  }
  return null
}

export const CERTIFICATE_SERIAL_ISSUANCE_PROGRAM =
  CertificateSerialAllocateRequestIssuanceSource.PROGRAM
export const CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE =
  CertificateSerialAllocateRequestIssuanceSource.FORM_TEMPLATE

export type CertificateSerialIssuanceSource = CertificateSerialAllocateRequestIssuanceSource

export type CertificateSerialSubject = {
  programId?: string | number | null
  subjectId?: string | number | null
  certificateType: string
  /** 양식 관리 샘플 다운로드. 프로그램/참가자 ID 없이 시퀀스만 발급 */
  issuanceSource?: CertificateSerialIssuanceSource
}

export function isFormTemplateCertificateSerialSubject(
  subject: CertificateSerialSubject
): boolean {
  return subject.issuanceSource === CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE
}
