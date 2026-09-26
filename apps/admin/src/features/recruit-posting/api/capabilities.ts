/**
 * 채용공고 — remote API opt-in
 * 실 JWT일 때만 Homepage OpenAPI 사용
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseRecruitPostingRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
