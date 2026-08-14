/**
 * 교육 대상 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseEducationTargetRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
