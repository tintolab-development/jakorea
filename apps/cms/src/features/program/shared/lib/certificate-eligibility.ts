/**
 * Admin `GET /api/admin/certificates/eligibility` 해석.
 * 정책 행이 없어도(`policyId` null / 미포함) blockingReasons 가 비고 eligible 이면 발급 가능이다.
 * 발급 기간은 FE에서 계산하지 않는다.
 */

export const CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE =
  'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE' as const

export const ISSUANCE_PERIOD_EXPIRED = 'ISSUANCE_PERIOD_EXPIRED' as const

export const PARTICIPANT_NOT_COMPLETED = 'PARTICIPANT_NOT_COMPLETED' as const

/** 동의 ledger 근거 없음 — 서버 error.message 와 동일 카피 */
export const CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE =
  '수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.'

export const ISSUANCE_PERIOD_EXPIRED_MESSAGE = '수료증 발급 기간이 만료되었습니다.'

export const PARTICIPANT_NOT_COMPLETED_MESSAGE = '수료 조건을 충족하지 않아 발급할 수 없습니다.'

export const CERTIFICATE_ELIGIBILITY_TYPE_COMPLETION = 'COMPLETION' as const

const CERTIFICATE_REASON_MESSAGES: Record<string, string> = {
  [CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE]: CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE,
  [ISSUANCE_PERIOD_EXPIRED]: ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  [PARTICIPANT_NOT_COMPLETED]: PARTICIPANT_NOT_COMPLETED_MESSAGE,
}

export type CertificateEligibilityLike = {
  eligible?: boolean | null
  policyId?: number | null
  reasonCode?: string | null
  blockingReasons?: readonly string[] | null
}

export function normalizeCertificateReasonCode(
  reason: string | null | undefined
): string {
  return reason?.trim().toUpperCase() ?? ''
}

export function certificateBlockingReasons(
  eligibility: CertificateEligibilityLike | null | undefined
): string[] {
  return Array.isArray(eligibility?.blockingReasons) ? [...eligibility.blockingReasons] : []
}

export function isCertificateConsentEvidenceUnavailable(
  reason: string | null | undefined
): boolean {
  return normalizeCertificateReasonCode(reason) === CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE
}

function eligibilityHasReason(
  eligibility: CertificateEligibilityLike | null | undefined,
  code: string
): boolean {
  const target = normalizeCertificateReasonCode(code)
  if (!target) return false
  if (normalizeCertificateReasonCode(eligibility?.reasonCode) === target) return true
  return certificateBlockingReasons(eligibility).some(
    reason => normalizeCertificateReasonCode(reason) === target
  )
}

/** eligibility 응답만으로 발급 가능 여부. policyId 유무는 판정에 쓰지 않는다. */
export function isCertificateEligibleForIssue(
  eligibility: CertificateEligibilityLike | null | undefined
): boolean {
  if (eligibility == null) return false
  if (eligibility.eligible !== true) return false
  return certificateBlockingReasons(eligibility).length === 0
}

export function messageForCertificateReasonCode(
  reasonCode: string | null | undefined
): string | null {
  const normalized = normalizeCertificateReasonCode(reasonCode)
  if (!normalized) return null
  return CERTIFICATE_REASON_MESSAGES[normalized] ?? null
}

/**
 * 동의 근거 없음·발급 기간 만료는 수료/참여 유형과 무관하게 발급 CTA를 막는다.
 * eligible=true 이고 blockingReasons 가 비면 reasonCode 가 있어도 통과한다.
 * PARTICIPANT_NOT_COMPLETED 만으로는 참여인증서 경로를 닫지 않는다.
 */
export function certificateIssuePrecheckBlockMessage(
  eligibility: CertificateEligibilityLike | null | undefined
): string | null {
  if (isCertificateEligibleForIssue(eligibility)) return null
  if (eligibilityHasReason(eligibility, CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE)) {
    return CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE
  }
  if (eligibilityHasReason(eligibility, ISSUANCE_PERIOD_EXPIRED)) {
    return ISSUANCE_PERIOD_EXPIRED_MESSAGE
  }
  return null
}
