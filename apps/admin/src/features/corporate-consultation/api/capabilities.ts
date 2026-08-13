/**
 * 기업 후원 상담 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseCorporateConsultationRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
