import { messageForPortalCertificateReasonCode } from './certificate-reason-messages.ts'
import type { PortalCertificateAvailability } from '../api/certificate-map.ts'
import type { EducationDisplayStatus } from '../model/types.ts'

export type CertificateCtaView =
  | { kind: 'hidden' }
  | { kind: 'issue' }
  | { kind: 'download'; issueId: number }
  | { kind: 'unavailable'; message: string }

export function shouldFetchIndividualCertificateAvailability(input: {
  isTeacher: boolean
  applicationType?: string | null
  displayStatus?: EducationDisplayStatus | null
  programId?: string | number | null
}): boolean {
  if (input.isTeacher) return false
  if (input.applicationType !== 'INDIVIDUAL') return false
  if (input.displayStatus !== 'completed') return false
  if (input.programId == null || String(input.programId).trim() === '') return false
  return true
}

export function resolveCertificateCtaView(input: {
  isTeacher: boolean
  applicationType?: string | null
  displayStatus?: EducationDisplayStatus | null
  availability?: PortalCertificateAvailability | null
}): CertificateCtaView {
  if (input.isTeacher) return { kind: 'hidden' }
  if (input.applicationType !== 'INDIVIDUAL') return { kind: 'hidden' }
  if (input.displayStatus !== 'completed') return { kind: 'hidden' }
  const availability = input.availability
  if (!availability) return { kind: 'hidden' }

  if (availability.canDownload) {
    const issueId = availability.existingIssueId
    if (typeof issueId === 'number' && Number.isFinite(issueId) && issueId > 0) {
      return { kind: 'download', issueId }
    }
  }
  if (availability.available && !availability.canDownload) {
    return { kind: 'issue' }
  }
  const message =
    availability.reasonMessage?.trim() ||
    messageForPortalCertificateReasonCode(availability.reasonCode) ||
    messageForPortalCertificateReasonCode(availability.reason)
  if (message) return { kind: 'unavailable', message }
  return { kind: 'hidden' }
}
