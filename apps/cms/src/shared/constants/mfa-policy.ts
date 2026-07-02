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

/** 백엔드 `LOCAL_TEST_CODE` MFA 방식용 고정 테스트 코드 (Swagger 예시) */
export const ADMIN_MFA_LOCAL_TEST_CODE = '000000'

/** 관리자 MFA 방식 (POST /api/admin/auth/login → mfaMethod) */
export const ADMIN_MFA_METHOD = {
  TOTP: 'TOTP',
  LOCAL_TEST_CODE: 'LOCAL_TEST_CODE',
} as const

export function normalizeAdminMfaMethod(method?: string): string {
  return method?.trim().toUpperCase() || ADMIN_MFA_METHOD.TOTP
}

export function isAdminLocalTestMfa(method?: string): boolean {
  return normalizeAdminMfaMethod(method) === ADMIN_MFA_METHOD.LOCAL_TEST_CODE
}

export function isAdminTotpMfa(method?: string): boolean {
  return normalizeAdminMfaMethod(method) === ADMIN_MFA_METHOD.TOTP
}
