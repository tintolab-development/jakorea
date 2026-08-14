/**
 * 참여하기 메뉴 링크 — remote API opt-in
 * API 로그인(실 JWT)일 때만 Homepage OpenAPI 사용
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseParticipateRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
