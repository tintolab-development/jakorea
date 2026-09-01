/**
 * 기업후원 안내 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseCorporateGuideRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
