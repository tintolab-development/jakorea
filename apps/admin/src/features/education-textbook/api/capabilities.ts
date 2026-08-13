/**
 * 교재 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseEducationTextbookRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
