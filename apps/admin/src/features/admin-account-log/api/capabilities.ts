/**
 * 관리자 계정 처리 이력 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseAdminAccountLogRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
