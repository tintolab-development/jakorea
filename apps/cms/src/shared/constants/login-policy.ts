/**
 * 로그인 정책 상수 정의
 * Phase 0.5.5: 세션/접근 통제 UX (NFR-SEC-AUT-02)
 * NFR-SEC-AUT-02: 로그인 시도 레이트리밋/잠금
 */

/**
 * 로그인 정책
 * NFR-SEC-AUT-02: 로그인 레이트리밋
 */
export const LOGIN_POLICY = {
  /** 최대 실패 횟수: 5회 실패 시 잠금 */
  maxFailedAttempts: 5,
  /** 잠금 시간: 30분 */
  lockoutDurationMinutes: 30,
  /** 실패 후 대기 시간 (ms) */
  cooldownAfterFailure: 3000,
} as const
