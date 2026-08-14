/**
 * 보고서 및 공시 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseReportsDisclosureRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
