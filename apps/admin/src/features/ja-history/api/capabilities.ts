/**
 * JA History 페이지 — remote API opt-in
 *
 * `/api/admin/ja-korea/history`는 연혁/수상/인증 목록이라 이 화면 계약이 아니다.
 * 전용 path `/api/admin/ja-korea/ja-history` 가 OpenAPI에 있으면 remote를 켠다.
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseJaHistoryRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
