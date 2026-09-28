/**
 * 재능기부 신청 — remote API opt-in
 * API 로그인(실 JWT)일 때만 Homepage talent-applications API 사용
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseTalentDonationApplicationRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
