/**
 * 방문자 통계 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseVisitorStatsRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
