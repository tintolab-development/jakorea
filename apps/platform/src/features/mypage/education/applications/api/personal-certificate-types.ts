/**
 * Portal 개인 수료증 — OpenAPI MemberCertificateAvailabilityResponse /
 * CertificateIssueRequest / CertificateIssueResponse (포털 me 경로).
 */

export type PortalPersonalCertificateType = 'AUTO' | 'COMPLETION' | 'PARTICIPATION' | string

export type PortalCertificateIssueReason =
  | 'INSTITUTION_SUBMISSION'
  | 'EDUCATION_COMPLETION_PROOF'
  | 'PERSONAL_ARCHIVE'

export type MemberCertificateAvailabilityResponse = {
  programId?: number
  participantId?: number | null
  certificateType?: string
  available?: boolean
  eligible?: boolean
  reason?: string
  reasonCode?: string
  reasonMessage?: string
  existingIssueId?: number | null
  canDownload?: boolean
}

export type PortalCertificateIssueRequest = {
  programId: number
  participantId: number
  /** 생략 또는 AUTO → 서버가 COMPLETION/PARTICIPATION 결정 */
  certificateType?: PortalPersonalCertificateType
  issueReason?: PortalCertificateIssueReason
}

export type PortalCertificateIssueResponse = {
  /** OpenAPI CertificateIssueResponse.issueId — 일부 응답은 certificateIssueId */
  issueId?: number
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
  const raw = response.certificateIssueId ?? response.issueId
  const id = typeof raw === 'number' ? raw : Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}
