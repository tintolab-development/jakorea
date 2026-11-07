/**
 * 세션 표시 정책. 실제 만료 시각은 GET /api/admin/auth/session 이 정본이다.
 * 임시 로컬 24시간 유휴 / 8시간 절대 제한은 사용하지 않는다.
 */
export {
  SESSION_ABSOLUTE_MAX_MS,
  SESSION_IDLE_MAX_MS,
  SESSION_POLICY_DISPLAY,
  SESSION_WARNING_LEAD_MS,
} from '@jakorea/domain/session'

export const SESSION_POLICY = {
  maxIdleMinutes: 30,
  absoluteMaxMinutes: 12 * 60,
  warningBeforeExpireMinutes: 5,
} as const
