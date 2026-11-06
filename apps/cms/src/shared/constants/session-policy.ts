/**
 * 세션 정책 상수 정의
 * Phase 0.5.5: 세션/접근 통제 UX (NFR-SEC-AUT-02)
 * NFR-SEC-AUT-02: 세션 만료 정책
 */

/**
 * 세션 정책
 * NFR-SEC-AUT-02: 세션 만료 정책
 *
 * [임시] 유휴 만료(maxIdleMinutes)를 Mock 토큰 TTL(24h)과 맞춤.
 * 운영 반영 전 원안은 비활성 30분 — 아래 maxIdleMinutes를 30으로 되돌릴 것.
 */
export const SESSION_POLICY = {
  /** [임시] 비활성 24시간 후 만료 (원안 NFR: 30분) */
  maxIdleMinutes: 24 * 60,
  /** 절대 최대 8시간 */
  absoluteMaxMinutes: 480,
  /** 만료 5분 전 경고 */
  warningBeforeExpireMinutes: 5,
} as const
