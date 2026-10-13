import type { PortalOrganizationPortraitConsent } from '../api/student-documents-types'

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
