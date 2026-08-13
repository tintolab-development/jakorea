/**
 * 개인정보 조회 이력 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUsePiiAccessLogRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
