import type { PortalCertificateAvailability } from '../api/certificate-map.ts'
import { shouldShowPersonalCertificateAction } from './personal-certificate-eligibility.ts'

export const PORTAL_CERTIFICATE_LIST_ACTION = 'ISSUE_CERTIFICATE'

export type CertificateCtaView =
  | { kind: 'hidden' }
  | { kind: 'issue' }
  | { kind: 'download'; issueId: number }

export function isPersonalCompletionCertificateSurface(input: {
  isTeacher?: boolean
  applicationType?: string | null
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
}): boolean {
  return shouldShowPersonalCertificateAction(input)
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

type PortalCertificateAvailabilityLike = {
  available?: boolean
  canDownload?: boolean
  existingIssueId?: number | null
  certificateType?: string | null
  reasonCode?: string | null
  reason?: string | null
  participantId?: number | null
  eligible?: boolean
}

function availabilityIssueId(
  availability: PortalCertificateAvailabilityLike | null | undefined,
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

  return resolvePortalCertificateAvailabilityCtaView(availability)
}

export function isPortalCertificateCtaOpen(
  availability: PortalCertificateAvailabilityLike | null | undefined,
): boolean {
  return resolvePortalCertificateAvailabilityCtaView(availability).kind !== 'hidden'
}

export type ExclusivePersonalCertificateSlot =
  | { type: 'COMPLETION'; view: CertificateCtaView }
  | { type: 'PARTICIPATION'; view: CertificateCtaView }
  | { type: null; view: { kind: 'hidden' } }

function normalizeCertificateType(
  certificateType: string | null | undefined,
): string {
  return (certificateType ?? '').trim().toUpperCase()
}

function normalizeCertificateReason(
  availability: PortalCertificateAvailabilityLike | null | undefined,
): string {
  return (availability?.reasonCode ?? availability?.reason ?? '').trim().toUpperCase()
}

function isParticipationBlockedByCompletion(
  availability: PortalCertificateAvailabilityLike | null | undefined,
): boolean {
  return normalizeCertificateReason(availability) === 'COMPLETION_CERTIFICATE_REQUIRED'
}

/**
 * AUTO/미지정 availability는 수료증(COMPLETION)만 평가한다.
 * 참가인증서 CTA는 GET certificateType=PARTICIPATION 응답으로만 연다.
 */
export function resolveAutoPersonalCertificateSlot(
  availability: PortalCertificateAvailabilityLike | null | undefined,
): ExclusivePersonalCertificateSlot {
  if (!availability) return { type: null, view: { kind: 'hidden' } }
  const type = normalizeCertificateType(availability.certificateType)
  if (type === 'PARTICIPATION') {
    return { type: null, view: { kind: 'hidden' } }
  }
  const completionAvailability =
    type === 'COMPLETION' || type === '' || type === 'AUTO'
      ? { ...availability, certificateType: 'COMPLETION' }
      : availability
  if (completionAvailability.available !== true) {
    return { type: null, view: { kind: 'hidden' } }
  }
  const view = resolvePortalCertificateAvailabilityCtaView(completionAvailability)
  if (view.kind === 'hidden') return { type: null, view }
  return { type: 'COMPLETION', view }
}

/**
 * 수료증·참가인증서는 한 슬롯만. 이중 조회는 COMPLETION이 이긴다.
 * AUTO 입력이 있으면 COMPLETION만 보고 PARTICIPATION CTA에 쓰지 않는다.
 * COMPLETION_CERTIFICATE_REQUIRED 이면 참가인증서 발급 CTA를 열지 않는다.
 */
export function resolveExclusivePersonalCertificateSlot(input: {
  auto?: PortalCertificateAvailabilityLike | null
  completion?: PortalCertificateAvailabilityLike | null | undefined
  participation?: PortalCertificateAvailabilityLike | null | undefined
}): ExclusivePersonalCertificateSlot {
  if (input.auto) return resolveAutoPersonalCertificateSlot(input.auto)
  if (input.completion?.available === true) {
    return {
      type: 'COMPLETION',
      view: resolvePortalCertificateAvailabilityCtaView(input.completion),
    }
  }
  if (
    isPortalCertificateCtaOpen(input.participation) &&
    !isParticipationBlockedByCompletion(input.participation)
  ) {
    return {
      type: 'PARTICIPATION',
      view: resolvePortalCertificateAvailabilityCtaView(input.participation),
    }
  }
  return { type: null, view: { kind: 'hidden' } }
}

/** 수료증·참가인증서는 한 슬롯만. 공존하지 않는다. 수료증이 가능하면 수료증, 아니면 참가인증서. */
export function resolveExclusivePersonalCertificateViews(input: {
  completion: CertificateCtaView
  participation: CertificateCtaView
}): { completion: CertificateCtaView; participation: CertificateCtaView } {
  if (input.completion.kind !== 'hidden') {
    return { completion: input.completion, participation: { kind: 'hidden' } }
  }
  return { completion: { kind: 'hidden' }, participation: input.participation }
}

/**
 * availability API SSOT.
 * 참가인증서는 기발급 PDF 다운로드 CTA를 쓰지 않고, 적격이면 항상 발급하기.
 * 수료증만 canDownload + existingIssueId 로 다운로드를 연다.
 */
export function resolvePortalCertificateAvailabilityCtaView(
  availability: PortalCertificateAvailabilityLike | null | undefined,
): CertificateCtaView {
  if (!availability) return { kind: 'hidden' }
  const isParticipation = normalizeCertificateType(availability.certificateType) === 'PARTICIPATION'
  if (isParticipation) {
    return availability.available === true ? { kind: 'issue' } : { kind: 'hidden' }
  }
  const issueId = availabilityIssueId(availability)
  if (availability.canDownload === true && issueId != null) {
    return { kind: 'download', issueId }
  }
  if (availability.available === true) {
    return { kind: 'issue' }
  }
  return { kind: 'hidden' }
}

function readPositiveId(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

/** 발급 POST participantId — availability.participantId만 사용한다 */
export function resolvePortalCertificateIssueParticipantId(input: {
  availabilityParticipantId?: number | null
  applicationParticipantId?: number | null
}): number | null {
  return readPositiveId(input.availabilityParticipantId)
}

