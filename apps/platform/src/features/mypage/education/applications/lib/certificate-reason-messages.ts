/**
 * 포털 수료증·참여증 reasonCode / error.code 안내.
 * 표시는 error.message 를 우선하고, 비어 있거나 code 원문일 때만 아래 카피를 쓴다.
 * 별도 consent 작성 API를 호출해 보완하지 않는다.
 */

export const CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE =
  'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE' as const

export const ISSUANCE_PERIOD_EXPIRED = 'ISSUANCE_PERIOD_EXPIRED' as const

export const PARTICIPANT_NOT_COMPLETED = 'PARTICIPANT_NOT_COMPLETED' as const

export const PORTAL_CERTIFICATE_ISSUANCE_NOT_READY =
  'PORTAL_CERTIFICATE_ISSUANCE_NOT_READY' as const

export const CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE =
  '수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.'

export const ISSUANCE_PERIOD_EXPIRED_MESSAGE = '수료증 발급 기간이 만료되었습니다.'

export const PARTICIPANT_NOT_COMPLETED_MESSAGE =
  '수료 조건을 충족하지 않아 발급할 수 없습니다.'

export const PORTAL_CERTIFICATE_ISSUANCE_NOT_READY_MESSAGE =
  '수료증을 아직 발급할 수 없습니다.'

const CERTIFICATE_REASON_FALLBACK_BY_CODE: Record<string, string> = {
  [CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE]: CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE,
  [ISSUANCE_PERIOD_EXPIRED]: ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  [PARTICIPANT_NOT_COMPLETED]: PARTICIPANT_NOT_COMPLETED_MESSAGE,
  [PORTAL_CERTIFICATE_ISSUANCE_NOT_READY]: PORTAL_CERTIFICATE_ISSUANCE_NOT_READY_MESSAGE,
}

export function messageForPortalCertificateReasonCode(
  reasonCode: string | null | undefined
): string | null {
  if (!reasonCode?.trim()) return null
  const normalized = reasonCode.trim().toUpperCase()
  return CERTIFICATE_REASON_FALLBACK_BY_CODE[normalized] ?? null
}
