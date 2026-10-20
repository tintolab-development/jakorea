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
