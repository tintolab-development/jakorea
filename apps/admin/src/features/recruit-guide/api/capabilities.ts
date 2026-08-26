/**
 * 채용 안내 — remote API opt-in
 * OpenAPI recruit 엔드포인트 연동 전: service는 local mock만 사용
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseRecruitGuideRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi() && false
}
