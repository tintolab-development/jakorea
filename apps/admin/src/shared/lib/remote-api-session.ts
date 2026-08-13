/**
 * Homepage remote API 세션 게이트
 * — Mock JWT면 local mock, 실 JWT면 OpenAPI generated client
 */

import { hasRemoteAdminJwt } from '@/entities/auth/api/auth-service'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

export function shouldUseHomepageRemoteApi(): boolean {
  return isRemoteApiConfigured() && hasRemoteAdminJwt()
}
