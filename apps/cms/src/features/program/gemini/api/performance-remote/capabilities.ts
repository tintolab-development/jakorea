import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/**
 * 실적 목록 SSOT — import path와 동일하게 training-reports 사용.
 * performance-records는 보조(정산/집계) 후보로 handoff에 남김.
 * @see programs-gemini-performance-api-backend-handoff.md
 */
export const GEMINI_PERFORMANCE_LIST_ENDPOINT = 'training-reports' as const

/** JWT + geminiPerformance 모듈 */
export function shouldUseGeminiPerformanceRemoteApi(): boolean {
  return hasRemoteAdminJwt() && isRealApiModuleEnabled('geminiPerformance')
}
