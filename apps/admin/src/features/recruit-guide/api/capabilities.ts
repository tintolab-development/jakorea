/**
 * 채용 안내 — remote API opt-in
 * 실 JWT일 때만 GET. 저장·추가·삭제는 API가 없다.
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseRecruitGuideRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
