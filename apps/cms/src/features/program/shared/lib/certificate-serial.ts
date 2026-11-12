import {
  CertificateSerialAllocateRequestCertificateType,
} from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateRequestCertificateType'
import { CertificateSerialAllocateRequestIssuanceSource } from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateRequestIssuanceSource'

/**
 * 양식 관리 미리보기 전용 가상 번호. 실제 발급 번호가 아님. API에 보내거나 성공 응답으로 쓰지 않는다.
 * 실제 문서번호 형식과 헷갈리지 않도록 숫자 연도·JA 접두를 쓰지 않는다.
 */
export const CERTIFICATE_SERIAL_PLACEHOLDER = 'SAMPLE-0000'

/** 이전 플레이스홀더(`YY-JA-00000`) — 저장·캐시된 값이 남아 있어도 미발급으로 본다 */
const LEGACY_CERTIFICATE_SERIAL_PLACEHOLDER_PATTERN = /^\d{2}-JA-0{5}$/

export const CERTIFICATE_SERIAL_PATTERN = /^\d{2}-JA-\d{5}$/

export const CERTIFICATE_SERIAL_TYPES = Object.values(
  CertificateSerialAllocateRequestCertificateType
) as CertificateSerialType[]

export type CertificateSerialType = CertificateSerialAllocateRequestCertificateType

export function isCertificateSerialPlaceholder(value: string | null | undefined): boolean {
  if (value == null) return true
  const trimmed = value.trim()
  return (
    trimmed === '' ||
    trimmed === CERTIFICATE_SERIAL_PLACEHOLDER ||
    LEGACY_CERTIFICATE_SERIAL_PLACEHOLDER_PATTERN.test(trimmed)
  )
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

/**
 * 인증서 발급 사유 코드 — `POST …/issues/serial` `issueReason`, 발급 이력 `issueReason`.
 * 포털 CertificateIssueRequest.issueReason과 같은 코드 체계. 허용 외 값은 400 CERTIFICATE_ISSUE_REASON_INVALID.
 */
export const CERTIFICATE_ISSUE_REASON_CODES = [
  'INSTITUTION_SUBMISSION',
  'EDUCATION_COMPLETION_PROOF',
  'PERSONAL_ARCHIVE',
] as const

export type CertificateIssueReasonCode = (typeof CERTIFICATE_ISSUE_REASON_CODES)[number]

/** 코드 → 화면 라벨 (발급 사유 모달 선택지와 같은 문구) */
export const CERTIFICATE_ISSUE_REASON_LABELS: Record<CertificateIssueReasonCode, string> = {
  INSTITUTION_SUBMISSION: '기관 제출용',
  EDUCATION_COMPLETION_PROOF: '교육 이수 증빙용',
  PERSONAL_ARCHIVE: '개인 보관용',
}

/** 코드값(대소문자 무관)만 허용. 그 외·빈 값은 null(사유 생략) */
export function normalizeCertificateIssueReasonCode(
  value: string | null | undefined
): CertificateIssueReasonCode | null {
  const normalized = value?.trim().toUpperCase() ?? ''
  return (CERTIFICATE_ISSUE_REASON_CODES as readonly string[]).includes(normalized)
    ? (normalized as CertificateIssueReasonCode)
    : null
}

/** 발급 사유 모달에서 고른 라벨 → 코드. 모르는 라벨이면 null */
export function certificateIssueReasonCodeFromLabel(
  label: string | null | undefined
): CertificateIssueReasonCode | null {
  const trimmed = label?.trim() ?? ''
  if (!trimmed) return null
  const entry = (
    Object.entries(CERTIFICATE_ISSUE_REASON_LABELS) as Array<[CertificateIssueReasonCode, string]>
  ).find(([, text]) => text === trimmed)
  return entry?.[0] ?? null
}

/** 발급 이력 `issueReason` 표시 — 코드면 한글 라벨, 모르는 값은 원문, 없으면 '-' */
export function formatCertificateIssueReasonLabel(value: string | null | undefined): string {
  const code = normalizeCertificateIssueReasonCode(value)
  if (code) return CERTIFICATE_ISSUE_REASON_LABELS[code]
  return value?.trim() || '-'
}

export type CertificateSerialSubject = {
  programId?: string | number | null
  subjectId?: string | number | null
  /** 기관 학생 명단 발급 — `POST …/serial/roster`. participantId가 아니다. */
  applicationId?: string | number | null
  rosterId?: string | number | null
  certificateType: string
  /** 양식 관리 샘플 다운로드. 프로그램/참가자 ID 없이 시퀀스만 발급 */
  issuanceSource?: CertificateSerialIssuanceSource
  /**
   * 발급 사유 코드 — 프로그램 참가자 발급(`POST …/issues/serial`)에만 싣는다. 생략 시 사유 없이 발급.
   * 재사용 발급(`reused=true`)이면 BE가 기존 사유를 유지한다.
   */
  issueReason?: CertificateIssueReasonCode | null
}

export function isFormTemplateCertificateSerialSubject(
  subject: CertificateSerialSubject
): boolean {
  return subject.issuanceSource === CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE
}

/** 기관 학생 명단 행 기준 발급. applicationId+rosterId가 있으면 participant 경로를 쓰지 않는다. */
export function isRosterCertificateSerialSubject(subject: CertificateSerialSubject): boolean {
  return (
    parseCertificateSerialInt64(subject.applicationId) != null &&
    parseCertificateSerialInt64(subject.rosterId) != null
  )
}
