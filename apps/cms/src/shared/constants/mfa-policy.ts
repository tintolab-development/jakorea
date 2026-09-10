/**
 * MFA/OTP 정책 상수 정의
 * Phase 0.5.1: MFA/OTP UX (NFR-SEC-AUT-01)
 * BE SSOT (2026-09-10): PrivacySecurityPolicy.MFA_MAX_FAILED_ATTEMPTS
 */

/**
 * 관리자 MFA 연속 실패 상한 — BE `MFA_MAX_FAILED_ATTEMPTS` 와 동일.
 * - 실패 1~5: MFA_VERIFICATION_FAILED (계속 입력)
 * - 실패 6: ACCOUNT_LOCKED (30분 잠금)
 * - 자동알림 ADMIN_MFA_FAILURE_NOTICE 는 BE가 정확히 5회째에만 발행 (FE invent 금지)
 */
export const MFA_MAX_FAILED_ATTEMPTS = 6 as const

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
  /** 연속 실패 시 잠금 — BE MFA_MAX_FAILED_ATTEMPTS */
  maxFailedAttempts: MFA_MAX_FAILED_ATTEMPTS,
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

/** 표시용 실패 횟수 — BE LEAST(..., 6) 과 동일하게 상한 클램프 */
export function clampMfaFailedAttempts(count: number): number {
  if (!Number.isFinite(count) || count < 0) return 0
  return Math.min(Math.floor(count), MFA_MAX_FAILED_ATTEMPTS)
}
