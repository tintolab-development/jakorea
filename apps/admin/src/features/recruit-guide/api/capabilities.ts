/**
 * 채용 안내 — remote API opt-in
 * 실 JWT 세션에서는 조회·저장 모두 백엔드 API를 사용한다.
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseRecruitGuideRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
