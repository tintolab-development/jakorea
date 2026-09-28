/**
 * 채용 안내 — remote API opt-in
 * 실 JWT일 때 GET. 저장 API는 없어 세션 캐시에만 반영한다.
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseRecruitGuideRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
