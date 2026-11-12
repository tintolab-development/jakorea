import { formatKoreanPhoneNumberPreservingMask } from '@jakorea/domain/shared/korean-phone'
import type {
  PortalOrganizationPortraitConsent,
  PortalStudentRosterItem,
} from '../api/student-documents-types'

const DASH = '-'

export function formatPortalStudentGender(gender?: string | null): string {
  const normalized = (gender ?? '').trim().toLowerCase()
  if (!normalized) return DASH
  if (
    normalized === 'male' ||
    normalized === 'm' ||
    normalized === '남' ||
    normalized === '남자'
  ) {
    return '남'
  }
  if (
    normalized === 'female' ||
    normalized === 'f' ||
    normalized === '여' ||
    normalized === '여자'
  ) {
    return '여'
  }
  return gender?.trim() || DASH
}

export function formatPortalStudentBirthDate(birthDate?: string | null): string {
  if (!birthDate?.trim()) return DASH
  const digits = birthDate.replace(/\D/g, '')
  if (digits.length >= 8) {
    const d = digits.slice(0, 8)
    return `${d.slice(0, 4)}. ${d.slice(4, 6)}. ${d.slice(6, 8)}.`
  }
  return birthDate.trim()
}

/**
 * 교사 화면 학생 명단 연락처 — 원문 표시, 조회 기록 대상 아님(개인정보 마스킹 정책 10/26, 사용자 플랫폼 7).
 * 서버 원문 `phone`을 쓰고, 원문이 없는 응답일 때만 `maskedPhone`으로 대신한다.
 */
export function formatPortalStudentPhone(
  row: Pick<PortalStudentRosterItem, 'phone' | 'maskedPhone'>,
): string {
  const raw = row.phone?.trim()
  if (raw) return formatKoreanPhoneNumberPreservingMask(raw) || raw
  return row.maskedPhone?.trim() || DASH
}

/** 교사 화면 학생 명단 이메일 — 서버 원문 `email`, 없을 때만 `maskedEmail`. */
export function formatPortalStudentEmail(
  row: Pick<PortalStudentRosterItem, 'email' | 'maskedEmail'>,
): string {
  return row.email?.trim() || row.maskedEmail?.trim() || DASH
}

export function formatPortalStudentGradeClass(
  grade?: string | null,
  className?: string | null,
): string {
  const c = className?.trim() ?? ''
  if (c) return c
  return grade?.trim() || DASH
}

export function resolvePortalStudentRosterRowNo(
  row: PortalStudentRosterItem,
  index: number,
): number {
  if (typeof row.studentNo === 'number' && Number.isFinite(row.studentNo)) {
    return row.studentNo
  }
  return index + 1
}

export function resolveStudentRosterCount(
  totalCount: number | undefined,
  rowLength: number,
): number {
  if (typeof totalCount === 'number' && totalCount >= 0) return totalCount
  return rowLength
}

export function hasOrganizationPortraitConsentSubmission(
  consent: PortalOrganizationPortraitConsent | null | undefined,
): boolean {
  if (!consent) return false
  if (consent.artifactId != null) return true
  if (consent.fileObjectId != null) return true
  return Boolean(consent.submittedAt?.trim())
}
