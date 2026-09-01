/**
 * MFA/OTP 정책 (CMS와 동일)
 */

export const OTP_POLICY = {
  validitySeconds: 180,
  resendCooldownSeconds: 60,
  maxDailyAttempts: 5,
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
} as const

export const OTP_LENGTH = 6

export const ADMIN_MFA_LOCAL_TEST_CODE = '000000'

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
