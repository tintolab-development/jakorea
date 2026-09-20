/**
 * 프로그램 소개 — Homepage JWT면 OpenAPI program-intros
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseEducationProgramIntroRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
