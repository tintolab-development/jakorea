/**
 * 메뉴별 조회 통계 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseMenuViewStatsRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
