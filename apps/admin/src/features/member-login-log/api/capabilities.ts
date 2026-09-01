/**
 * 회원 로그인 이력 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseMemberLoginLogRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
