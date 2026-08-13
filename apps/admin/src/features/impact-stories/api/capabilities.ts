/**
 * 임팩트 스토리 — remote API opt-in
 * API 로그인(실 JWT)일 때만 Homepage OpenAPI 사용
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseImpactStoriesRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}

/** 카테고리 list/create/update/delete */
export function shouldUseImpactStoryCategoriesRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
