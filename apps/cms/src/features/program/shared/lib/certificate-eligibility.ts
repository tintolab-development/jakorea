/**
 * Admin `GET /api/admin/certificates/eligibility` 해석.
 * 정책 행이 없어도(`policyId` null / 미포함) blockingReasons 가 비고 eligible 이면 발급 가능이다.
 * 발급 기간은 FE에서 계산하지 않는다.
 */

export const CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE =
  'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE' as const

export const ISSUANCE_PERIOD_EXPIRED = 'ISSUANCE_PERIOD_EXPIRED' as const

export const PARTICIPANT_NOT_COMPLETED = 'PARTICIPANT_NOT_COMPLETED' as const

export const COMPLETION_CERTIFICATE_REQUIRED = 'COMPLETION_CERTIFICATE_REQUIRED' as const

/** 동의 ledger 근거 없음 — 서버 error.message 와 동일 카피 */
export const CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE =
  '수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.'

export const ISSUANCE_PERIOD_EXPIRED_MESSAGE =
  '신청일로부터 3년이 지나 발급할 수 없습니다.'

export const CERTIFICATE_APPLICATION_DATE_UNAVAILABLE =
  'CERTIFICATE_APPLICATION_DATE_UNAVAILABLE' as const

export const CERTIFICATE_APPLICATION_DATE_UNAVAILABLE_MESSAGE =
  '신청일을 확인할 수 없어 발급할 수 없습니다.'

export const PARTICIPANT_NOT_COMPLETED_MESSAGE = '수료 조건을 충족하지 않아 발급할 수 없습니다.'

export const COMPLETION_CERTIFICATE_REQUIRED_MESSAGE =
  '수료 조건을 충족한 뒤에는 수료증을 발급해 주세요.'

export const CERTIFICATE_ELIGIBILITY_TYPE_COMPLETION = 'COMPLETION' as const
export const CERTIFICATE_ELIGIBILITY_TYPE_PARTICIPATION = 'PARTICIPATION' as const
export const CERTIFICATE_ELIGIBILITY_TYPE_AUTO = 'AUTO' as const

export type CertificateEligibilityApiType = 'COMPLETION' | 'PARTICIPATION'

const CERTIFICATE_NO_RECOGNIZED_RECORD = 'NO_RECOGNIZED_RECORD'
const CERTIFICATE_NO_RECOGNIZED_ATTENDANCE = 'NO_RECOGNIZED_ATTENDANCE'
const CERTIFICATE_GIVE_UP_NO_RECORD = 'GIVE_UP_NO_RECORD'

export const CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE =
  '인정된 교육 실적이 없어 참가인증서를 발급할 수 없습니다.'

const CERTIFICATE_REASON_MESSAGES: Record<string, string> = {
  [CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE]: CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE,
  [CERTIFICATE_APPLICATION_DATE_UNAVAILABLE]: CERTIFICATE_APPLICATION_DATE_UNAVAILABLE_MESSAGE,
  [ISSUANCE_PERIOD_EXPIRED]: ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  [PARTICIPANT_NOT_COMPLETED]: PARTICIPANT_NOT_COMPLETED_MESSAGE,
  [COMPLETION_CERTIFICATE_REQUIRED]: COMPLETION_CERTIFICATE_REQUIRED_MESSAGE,
  CERTIFICATE_ALREADY_ISSUED: '이미 발급된 증명서입니다.',
  CERTIFICATE_ISSUE_REASON_INVALID: '발급 사유가 올바르지 않습니다. 발급 사유를 다시 선택해 주세요.',
  CERTIFICATE_ISSUE_NOT_ELIGIBLE: '증명서 발급 요건을 충족하지 않았습니다.',
  ATTENDANCE_NOT_COMPLETED: PARTICIPANT_NOT_COMPLETED_MESSAGE,
  MEMBER_PARTICIPATION_CERTIFICATE_SELF_ISSUE_NOT_ALLOWED:
    '참가인증서는 회원·학생·교사가 직접 발급할 수 없습니다.',
  [CERTIFICATE_NO_RECOGNIZED_RECORD]: CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE,
  [CERTIFICATE_NO_RECOGNIZED_ATTENDANCE]: CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE,
  [CERTIFICATE_GIVE_UP_NO_RECORD]: CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE,
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

const SATISFACTION_SURVEY_NOT_COMPLETED = 'SATISFACTION_SURVEY_NOT_COMPLETED'

export function certificateBlockingReasons(
  eligibility: CertificateEligibilityLike | null | undefined
): string[] {
  return Array.isArray(eligibility?.blockingReasons)
    ? eligibility.blockingReasons.filter(
        reason => normalizeCertificateReasonCode(reason) !== SATISFACTION_SURVEY_NOT_COMPLETED
      )
    : []
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
 * PARTICIPANT_NOT_COMPLETED 만으로는 참가인증서 경로를 닫지 않는다.
 */
export function certificateIssuePrecheckBlockMessage(
  eligibility: CertificateEligibilityLike | null | undefined
): string | null {
  if (isCertificateEligibleForIssue(eligibility)) return null
  if (eligibilityHasReason(eligibility, CERTIFICATE_APPLICATION_DATE_UNAVAILABLE)) {
    return CERTIFICATE_APPLICATION_DATE_UNAVAILABLE_MESSAGE
  }
  if (eligibilityHasReason(eligibility, CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE)) {
    return CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE
  }
  if (eligibilityHasReason(eligibility, ISSUANCE_PERIOD_EXPIRED)) {
    return ISSUANCE_PERIOD_EXPIRED_MESSAGE
  }
  return null
}

export function mapCertificateEligibilityTypeToKind(
  certificateType: string | null | undefined
): CertificateEligibilityApiType | null {
  const normalized = normalizeCertificateReasonCode(certificateType)
  if (normalized === CERTIFICATE_ELIGIBILITY_TYPE_COMPLETION) return 'COMPLETION'
  if (normalized === CERTIFICATE_ELIGIBILITY_TYPE_PARTICIPATION) return 'PARTICIPATION'
  return null
}

function looksLikeReasonCode(value: string): boolean {
  return /^[A-Z][A-Z0-9_]+$/.test(value.trim())
}

export function certificateIssueIneligibleMessage(
  eligibility: CertificateEligibilityLike | null | undefined
): string {
  const fromCode = messageForCertificateReasonCode(eligibility?.reasonCode)
  if (fromCode) return fromCode
  for (const reason of certificateBlockingReasons(eligibility)) {
    const mapped = messageForCertificateReasonCode(reason)
    if (mapped) return mapped
    if (reason.trim() && !looksLikeReasonCode(reason)) return reason.trim()
  }
  return '발급할 수 없습니다.'
}

const CERTIFICATE_PERIOD_START_KEY = 'certificatePeriodStartDate'
const CERTIFICATE_PERIOD_END_KEY = 'certificatePeriodEndDate'
const CERTIFICATE_PERIOD_LABEL_KEY = 'certificatePeriodLabel'
const CERTIFICATE_COUNTED_PARTICIPATION_COUNT_KEY = 'countedParticipationCount'

export const CERTIFICATE_CERTIFIED_PERIOD_MISSING_MESSAGE =
  '인증 참여 기간을 확인할 수 없어 참가인증서를 발급할 수 없습니다.'

export type CertificateCertifiedPeriod = {
  start: string | null
  end: string | null
  label: string | null
  countedParticipationCount: number | null
}

function readOptionalTrimmedString(
  payload: Record<string, unknown>,
  key: string
): string | null {
  const value = payload[key]
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function readOptionalFiniteNumber(
  payload: Record<string, unknown>,
  key: string
): number | null {
  const value = payload[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

/**
 * `GET /api/admin/certificates/eligibility` 정식 기간 필드만 읽는다.
 * 비공식 별칭(`participationStartDate` 등)은 쓰지 않고, 기간을 FE에서 계산하지 않는다.
 */
export function readCertificateCertifiedPeriod(
  payload: object | null | undefined
): CertificateCertifiedPeriod | null {
  if (payload == null || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const start = readOptionalTrimmedString(record, CERTIFICATE_PERIOD_START_KEY)
  const end = readOptionalTrimmedString(record, CERTIFICATE_PERIOD_END_KEY)
  const label = readOptionalTrimmedString(record, CERTIFICATE_PERIOD_LABEL_KEY)
  const countedParticipationCount = readOptionalFiniteNumber(
    record,
    CERTIFICATE_COUNTED_PARTICIPATION_COUNT_KEY
  )
  if (!start && !end && !label && countedParticipationCount == null) return null
  return { start, end, label, countedParticipationCount }
}

export function hasUsableCertificateCertifiedPeriod(
  period: CertificateCertifiedPeriod | null | undefined
): boolean {
  if (period == null) return false
  if (period.label) return true
  return Boolean(period.start && period.end)
}

/**
 * GIVE_UP 참가인증서는 기간이 없으면 사업 전체 기간으로 대체하지 않는다.
 * 정상 수료·진행 중 발급은 null을 돌려 기존 프로그램 기간 정책을 유지한다.
 */
export function certificateCertifiedPeriodIssueBlockMessage(input: {
  activityWithdrawn?: boolean
  period: CertificateCertifiedPeriod | null | undefined
}): string | null {
  if (input.activityWithdrawn !== true) return null
  if (input.period?.countedParticipationCount === 0) {
    return CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE
  }
  if (hasUsableCertificateCertifiedPeriod(input.period)) return null
  return CERTIFICATE_CERTIFIED_PERIOD_MISSING_MESSAGE
}

export type CertificateIssuePlan = {
  apiType: CertificateEligibilityApiType
  eligible: boolean
  blockMessage: string | null
  eligibility: CertificateEligibilityLike | null
}

function planFromEligibility(
  apiType: CertificateEligibilityApiType,
  eligibility: CertificateEligibilityLike | null | undefined
): CertificateIssuePlan {
  if (isCertificateEligibleForIssue(eligibility)) {
    return { apiType, eligible: true, blockMessage: null, eligibility: eligibility ?? null }
  }
  const hardBlock = certificateIssuePrecheckBlockMessage(eligibility)
  return {
    apiType,
    eligible: false,
    blockMessage: hardBlock ?? certificateIssueIneligibleMessage(eligibility),
    eligibility: eligibility ?? null,
  }
}

/**
 * 수료증/참가인증서 자격. 활동 포기면 수료증을 쓰지 않고 참가인증서 응답만 본다.
 * 화면 not_held 등으로 유형을 확정하지 않는다.
 */
export function selectIssuableCertificatePlan(input: {
  activityWithdrawn?: boolean
  completion?: CertificateEligibilityLike | null
  participation?: CertificateEligibilityLike | null
}): CertificateIssuePlan {
  if (input.activityWithdrawn === true) {
    return planFromEligibility('PARTICIPATION', input.participation)
  }
  if (isCertificateEligibleForIssue(input.completion)) {
    return planFromEligibility('COMPLETION', input.completion)
  }
  if (isCertificateEligibleForIssue(input.participation)) {
    return planFromEligibility('PARTICIPATION', input.participation)
  }
  const completionHardBlock = certificateIssuePrecheckBlockMessage(input.completion)
  if (completionHardBlock) {
    return {
      apiType: 'COMPLETION',
      eligible: false,
      blockMessage: completionHardBlock,
      eligibility: input.completion ?? null,
    }
  }
  const participationHardBlock = certificateIssuePrecheckBlockMessage(input.participation)
  if (participationHardBlock) {
    return {
      apiType: 'PARTICIPATION',
      eligible: false,
      blockMessage: participationHardBlock,
      eligibility: input.participation ?? null,
    }
  }
  if (input.participation != null) {
    return planFromEligibility('PARTICIPATION', input.participation)
  }
  return planFromEligibility('COMPLETION', input.completion)
}
