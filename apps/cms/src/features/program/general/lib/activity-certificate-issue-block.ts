import {
  certificateBlockingReasons,
  isCertificateEligibleForIssue,
  ISSUANCE_PERIOD_EXPIRED,
  messageForCertificateReasonCode,
  normalizeCertificateReasonCode,
  type CertificateEligibilityLike,
} from '@/features/program/shared/lib/certificate-eligibility'
import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'

/** 활동인증서(강사·봉사자, UJAT 포함) 발급 불가 팝업 — 기획 회신 261113 #2-2 */
export const ACTIVITY_CERTIFICATE_BLOCKED_TITLE = '활동인증서 발급 불가 안내'

/** 서버 사유 코드: 진행 완료된 본인 활동 일정 없음(발급 조건 = 진행 완료 일정 1건 이상) */
export const ACTIVITY_NOT_COMPLETED = 'ACTIVITY_NOT_COMPLETED' as const

export const ACTIVITY_CERTIFICATE_ISSUANCE_PERIOD_EXPIRED_MESSAGE =
  '프로그램 신청일로부터 3년이 지난 활동인증서는 발급이 불가합니다.'
export const ACTIVITY_CERTIFICATE_NO_COMPLETED_SCHEDULE_MESSAGE =
  '진행 완료된 활동 일정이 없어 활동인증서 발급이 불가합니다.'

const ACTIVITY_CERTIFICATE_REASON_MESSAGES: Record<string, string> = {
  [ISSUANCE_PERIOD_EXPIRED]: ACTIVITY_CERTIFICATE_ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  [ACTIVITY_NOT_COMPLETED]: ACTIVITY_CERTIFICATE_NO_COMPLETED_SCHEDULE_MESSAGE,
}

/** 확정 문구가 없는 사유 — 기존 공통 증명서 문구(수료증 전용 문구는 쓰지 않는다) */
const ACTIVITY_CERTIFICATE_FALLBACK_MESSAGE =
  messageForCertificateReasonCode('CERTIFICATE_ISSUE_NOT_ELIGIBLE') ??
  '증명서 발급 요건을 충족하지 않았습니다.'

export function messageForActivityCertificateReasonCode(
  reasonCode: string | null | undefined
): string | null {
  const normalized = normalizeCertificateReasonCode(reasonCode)
  if (!normalized) return null
  return ACTIVITY_CERTIFICATE_REASON_MESSAGES[normalized] ?? null
}

/** eligibility 응답 기준 발급 불가 문구. 발급 가능하면 null */
export function activityCertificateBlockMessage(
  eligibility: CertificateEligibilityLike | null | undefined
): string | null {
  if (eligibility == null || isCertificateEligibleForIssue(eligibility)) return null
  const reasons = [...certificateBlockingReasons(eligibility), eligibility.reasonCode]
  for (const reason of reasons) {
    const message = messageForActivityCertificateReasonCode(reason)
    if (message) return message
  }
  return ACTIVITY_CERTIFICATE_FALLBACK_MESSAGE
}

/** 발급(고유번호) API 오류 중 활동인증서 발급 불가 사유면 확정 문구, 아니면 null */
export function activityCertificateBlockMessageFromError(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  return messageForActivityCertificateReasonCode(extractApiErrorCode(data))
}
