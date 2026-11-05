import type { PortalCertificateAvailability } from '../api/certificate-map.ts'

export const PORTAL_CERTIFICATE_LIST_ACTION = 'ISSUE_CERTIFICATE'

export type CertificateCtaView =
  | { kind: 'hidden' }
  | { kind: 'issue' }
  | { kind: 'download'; issueId: number }

function normalizeCode(value?: string | null): string {
  return (value ?? '').trim().toUpperCase()
}

export function isPersonalCompletionCertificateSurface(input: {
  isTeacher?: boolean
  applicationType?: string | null
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
}): boolean {
  if (input.isTeacher) return false
  if (input.applicationType !== 'INDIVIDUAL') return false
  if (input.detailCase === 'gemini') return false
  const programType = normalizeCode(input.programType)
  const programGroup = normalizeCode(input.programGroup)
  if (
    programType === 'GEMINI' ||
    programType === 'GEMINI_TRAINING' ||
    programType === 'VISITING_TRAINING'
  ) {
    return false
  }
  if (programType === 'TRAINED_TEACHER' || programGroup === 'TRAINED_TEACHER') return false
  return true
}

export function listRowCertificateAvailable(row: {
  certificateAvailable?: boolean | null
  availableActions?: readonly string[] | null
}): boolean {
  if (row.certificateAvailable === true) return true
  return (row.availableActions ?? []).includes(PORTAL_CERTIFICATE_LIST_ACTION)
}

export function shouldShowListCertificateEntry(input: {
  isTeacher?: boolean
  applicationType?: string | null
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
  certificateAvailable?: boolean | null
  availableActions?: readonly string[] | null
}): boolean {
  if (!isPersonalCompletionCertificateSurface(input)) return false
  return listRowCertificateAvailable(input)
}

export function shouldShowDetailCertificateCta(input: {
  isTeacher?: boolean
  applicationType?: string | null
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
  canIssueCertificate?: boolean | null
}): boolean {
  return isPersonalCompletionCertificateSurface(input)
}

export function shouldFetchIndividualCertificateAvailability(input: {
  isTeacher?: boolean
  applicationType?: string | null
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
  canIssueCertificate?: boolean | null
  programId?: string | number | null
}): boolean {
  if (input.programId == null || String(input.programId).trim() === '') return false
  return isPersonalCompletionCertificateSurface(input)
}

function availabilityIssueId(
  availability: PortalCertificateAvailability | null | undefined,
): number | null {
  const issueId = availability?.existingIssueId
  if (typeof issueId === 'number' && Number.isFinite(issueId) && issueId > 0) return issueId
  return null
}

export function resolveCertificateCtaView(input: {
  isTeacher?: boolean
  applicationType?: string | null
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
  canIssueCertificate?: boolean | null
  certificateStatus?: string | null
  availability?: PortalCertificateAvailability | null
}): CertificateCtaView {
  if (!shouldShowDetailCertificateCta(input)) return { kind: 'hidden' }
  const availability = input.availability
  if (!availability) return { kind: 'hidden' }

  const issueId = availabilityIssueId(availability)
  if (availability.canDownload === true || issueId != null) {
    if (issueId == null) return { kind: 'hidden' }
    return { kind: 'download', issueId }
  }
  const certificateType = normalizeCode(availability.certificateType)
  if (certificateType === 'PARTICIPATION' || certificateType.includes('PARTICIPATION')) {
    return { kind: 'hidden' }
  }
  if (availability.available === true) {
    return { kind: 'issue' }
  }
  return { kind: 'hidden' }
}

