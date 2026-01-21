/**
 * MFA/OTP 정책 상수 정의
 * Phase 0.5.1: MFA/OTP UX (NFR-SEC-AUT-01)
 * §별첨1 5조: SMS MFA(OTP) 상세 정책
 */

/**
 * OTP 정책
 * §별첨1 5조: SMS MFA(OTP) 상세 정책
 */
export const OTP_POLICY = {
  /** OTP 유효시간: 3분 (권장 3~5분) */
  validitySeconds: 180,
  /** 재전송 쿨다운: 60초 */
  resendCooldownSeconds: 60,
  /** 일일 발송 제한: 5회 */
  maxDailyAttempts: 5,
  /** 연속 실패 시 잠금: 5회 */
  maxFailedAttempts: 5,
  /** 잠금 시간: 30분 */
  lockoutDurationMinutes: 30,
} as const

/**
 * OTP 길이
 */
export const OTP_LENGTH = 6
