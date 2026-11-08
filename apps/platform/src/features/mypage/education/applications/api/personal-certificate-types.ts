/**
 * Portal 개인 수료증 — OpenAPI MemberCertificateAvailabilityResponse /
 * CertificateIssueRequest / CertificateIssueResponse (포털 me 경로).
 */

export type PortalPersonalCertificateType =
  | 'AUTO'
  | 'COMPLETION'
  | 'PARTICIPATION'
  | 'INSTRUCTOR_ACTIVITY'
  | 'VOLUNTEER_ACTIVITY'

export type PortalCertificateIssueReason =
  | 'INSTITUTION_SUBMISSION'
  | 'EDUCATION_COMPLETION_PROOF'
  | 'PERSONAL_ARCHIVE'

export type MemberCertificateAvailabilityResponse = {
  programId?: number
  participantId?: number | null
  certificateType?: string | null
  available?: boolean
  eligible?: boolean
  reason?: string | null
  reasonCode?: string | null
  reasonMessage?: string | null
  existingIssueId?: number | null
  canDownload?: boolean
  countedParticipationCount?: number | null
  certificatePeriodStartDate?: string | null
  certificatePeriodEndDate?: string | null
  certificatePeriodLabel?: string | null
}

export type PortalCertificateIssueRequest = {
  programId: number
  participantId: number
  /** 포털 발급은 COMPLETION만. PARTICIPATION 자가 발급은 보내지 않는다. */
  certificateType?: PortalPersonalCertificateType
  issueReason?: PortalCertificateIssueReason
}

export type PortalCertificateIssueResponse = {
  /** 포털 발급 응답 SSOT. OpenAPI/도메인 issueId 와 동일 값. */
  certificateIssueId?: number
  programId?: number
  participantId?: number
  memberId?: number
  certificateType?: string
  issueStatus?: string
  policyId?: number
  issuedByAdminId?: number
  issuedAt?: string
  downloadCount?: number
  lastDownloadedAt?: string
}

export function readPortalCertificateIssueId(
  response: PortalCertificateIssueResponse | null | undefined,
): number | null {
  if (!response) return null
  const raw = response.certificateIssueId
  const id = typeof raw === 'number' ? raw : Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}
