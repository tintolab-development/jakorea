/**
 * 버그/이슈 이력 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseBugIssueLogRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
