/** 양식 관리 미리보기 전용. 실제 발급 번호가 아님 */
export const CERTIFICATE_SERIAL_PLACEHOLDER = '26-JA-00000'

export const CERTIFICATE_SERIAL_PATTERN = /^\d{2}-JA-\d{5}$/

export const CERTIFICATE_SERIAL_TYPES = [
  'document-3',
  'document-participation-certificate',
  'document-4',
  'document-5',
] as const

export type CertificateSerialType = (typeof CERTIFICATE_SERIAL_TYPES)[number]

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

export type CertificateSerialSubject = {
  programId?: string | number | null
  subjectId: string | number
  certificateType: string
}

export function formatCertificateSerial(sequence: number, issuedAt: Date = new Date()): string {
  const year = issuedAt.getFullYear()
  const yy = String(year).slice(-2)
  const n = Math.max(1, Math.floor(sequence)) % 100000
  return `${yy}-JA-${String(n).padStart(5, '0')}`
}

/** 같은 발급 대상이면 항상 같은 목 번호 (재진입 시 새로 뽑지 않음) */
export function mockCertificateSerial(
  subject: CertificateSerialSubject,
  issuedAt: Date = new Date()
): string {
  const key = [
    String(subject.programId ?? ''),
    String(subject.subjectId),
    subject.certificateType,
  ].join('|')
  return formatCertificateSerial(stablePositiveInt(key), issuedAt)
}

function stablePositiveInt(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 99999) + 1
}
