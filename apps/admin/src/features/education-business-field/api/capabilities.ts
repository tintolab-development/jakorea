/**
 * 사업분야 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseEducationBusinessFieldRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
