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

export const CERTIFICATE_RENDER_HISTORICAL_DATA_INCOMPLETE =
  'CERTIFICATE_RENDER_HISTORICAL_DATA_INCOMPLETE' as const

export const CERTIFICATE_OFFICIAL_TEMPLATE_UNAVAILABLE =
  'CERTIFICATE_OFFICIAL_TEMPLATE_UNAVAILABLE' as const

export const CERTIFICATE_RENDER_HISTORICAL_DATA_INCOMPLETE_MESSAGE =
  '이름 또는 프로그램명이 없어 수료증을 만들 수 없습니다.'

export const CERTIFICATE_OFFICIAL_TEMPLATE_UNAVAILABLE_MESSAGE =
  '수료증 양식 또는 서버 설정에 문제가 있습니다. 관리자에게 문의해 주세요.'

const CERTIFICATE_REASON_FALLBACK_BY_CODE: Record<string, string> = {
  [CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE]: CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE,
  [ISSUANCE_PERIOD_EXPIRED]: ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  [PARTICIPANT_NOT_COMPLETED]: PARTICIPANT_NOT_COMPLETED_MESSAGE,
  [PORTAL_CERTIFICATE_ISSUANCE_NOT_READY]: PORTAL_CERTIFICATE_ISSUANCE_NOT_READY_MESSAGE,
  [CERTIFICATE_RENDER_HISTORICAL_DATA_INCOMPLETE]:
    CERTIFICATE_RENDER_HISTORICAL_DATA_INCOMPLETE_MESSAGE,
  [CERTIFICATE_OFFICIAL_TEMPLATE_UNAVAILABLE]: CERTIFICATE_OFFICIAL_TEMPLATE_UNAVAILABLE_MESSAGE,
}

export function messageForPortalCertificateReasonCode(
  reasonCode: string | null | undefined
): string | null {
  if (!reasonCode?.trim()) return null
  const normalized = reasonCode.trim().toUpperCase()
  return CERTIFICATE_REASON_FALLBACK_BY_CODE[normalized] ?? null
}

/** CERTIFICATE_RENDER 실패·발급 API error.code */
export function messageForPortalCertificateRenderErrorCode(
  errorCode: string | null | undefined,
): string | null {
  return messageForPortalCertificateReasonCode(errorCode)
}
