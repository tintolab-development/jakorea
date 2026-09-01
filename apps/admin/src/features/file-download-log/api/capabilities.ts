/**
 * 파일 다운로드 이력 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseFileDownloadLogRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
