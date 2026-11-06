export const PORTAL_CERTIFICATE_TYPE_COMPLETION = 'COMPLETION' as const
export const PORTAL_CERTIFICATE_TYPE_PARTICIPATION = 'PARTICIPATION' as const

export type PortalCertificateType =
  | typeof PORTAL_CERTIFICATE_TYPE_COMPLETION
  | typeof PORTAL_CERTIFICATE_TYPE_PARTICIPATION
  | 'INSTRUCTOR_ACTIVITY'
  | 'VOLUNTEER_ACTIVITY'
  | 'AUTO'
  | string

export type PortalCertificateAvailability = {
  programId?: number
  participantId?: number | null
  certificateType?: string
  available: boolean
  reason?: string | null
  eligible?: boolean
  reasonCode?: string | null
  reasonMessage?: string | null
  existingIssueId?: number | null
  canDownload: boolean
  countedParticipationCount?: number | null
  certificatePeriodStartDate?: string | null
  certificatePeriodEndDate?: string | null
  certificatePeriodLabel?: string | null
}

export type PortalCertificateIssueRequest = {
  programId: number
  participantId: number
  certificateType?: PortalCertificateType
  issueReason?: 'INSTITUTION_SUBMISSION' | 'EDUCATION_COMPLETION_PROOF' | 'PERSONAL_ARCHIVE'
}

export type PortalCertificateIssueResult = {
  certificateIssueId: number
  issueStatus?: string
  issuedAt?: string | null
  programId?: number
  participantId?: number
  certificateType?: string
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readBoolean(value: unknown): boolean {
  return value === true
}

export function mapPortalCertificateAvailability(
  payload: unknown,
): PortalCertificateAvailability {
  const body = unwrapEnvelope<Record<string, unknown>>(payload)
  const record = body && typeof body === 'object' ? body : {}
  return {
    programId: readOptionalNumber(record.programId) ?? undefined,
    participantId: readOptionalNumber(record.participantId),
    certificateType: readOptionalString(record.certificateType) ?? undefined,
    available: readBoolean(record.available),
    reason: readOptionalString(record.reason),
    eligible: readBoolean(record.eligible),
    reasonCode: readOptionalString(record.reasonCode),
    reasonMessage: readOptionalString(record.reasonMessage),
    existingIssueId: readOptionalNumber(record.existingIssueId),
    canDownload: readBoolean(record.canDownload),
    countedParticipationCount: readOptionalNumber(record.countedParticipationCount),
    certificatePeriodStartDate: readOptionalString(record.certificatePeriodStartDate),
    certificatePeriodEndDate: readOptionalString(record.certificatePeriodEndDate),
    certificatePeriodLabel: readOptionalString(record.certificatePeriodLabel),
  }
}

export function mapPortalCertificateIssueResult(payload: unknown): PortalCertificateIssueResult {
  const body = unwrapEnvelope<Record<string, unknown>>(payload)
  const record = body && typeof body === 'object' ? body : {}
  const certificateIssueId = readOptionalNumber(record.certificateIssueId)
  if (certificateIssueId == null) {
    throw new Error('수료증 발급 결과를 확인하지 못했습니다.')
  }
  return {
    certificateIssueId,
    issueStatus: readOptionalString(record.issueStatus) ?? undefined,
    issuedAt: readOptionalString(record.issuedAt),
    programId: readOptionalNumber(record.programId) ?? undefined,
    participantId: readOptionalNumber(record.participantId) ?? undefined,
    certificateType: readOptionalString(record.certificateType) ?? undefined,
  }
}

export function portalCertificateAvailabilityPath(
  programId: number,
  certificateType: PortalCertificateType = PORTAL_CERTIFICATE_TYPE_COMPLETION,
): string {
  const query = new URLSearchParams({ certificateType })
  return `/api/portal/me/programs/${encodeURIComponent(String(programId))}/certificates/availability?${query.toString()}`
}

export function portalCertificateIssuePath(): string {
  return '/api/portal/me/certificates/issues'
}

export function portalCertificateDownloadPath(certificateIssueId: number): string {
  return `/api/portal/me/certificates/${encodeURIComponent(String(certificateIssueId))}/download`
}
