/**
 * 세션 정책 상수 정의
 * Phase 0.5.5: 세션/접근 통제 UX (NFR-SEC-AUT-02)
 * NFR-SEC-AUT-02: 세션 만료 정책
 */

/**
 * 세션 정책
 * NFR-SEC-AUT-02: 세션 만료 정책
 */
export const SESSION_POLICY = {
  /** 비활성 30분 후 만료 */
  maxIdleMinutes: 30,
  /** 절대 최대 8시간 */
  absoluteMaxMinutes: 480,
  /** 만료 5분 전 경고 */
  warningBeforeExpireMinutes: 5,
} as const
