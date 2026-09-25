/**
 * 재능기부 소개 — remote API opt-in
 * API 로그인(실 JWT)일 때만 Homepage talent API 사용
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseTalentDonationIntroRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
