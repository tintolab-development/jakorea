/**
 * 인재채용 — remote API opt-in
 * 실 JWT일 때만 Homepage OpenAPI 사용. 목록은 no-store.
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseRecruitApplicantRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
