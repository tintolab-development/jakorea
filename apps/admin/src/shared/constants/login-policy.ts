/**
 * 로그인 정책 (CMS NFR-SEC-AUT-02 동일)
 */
export const LOGIN_POLICY = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  cooldownAfterFailure: 3000,
} as const
