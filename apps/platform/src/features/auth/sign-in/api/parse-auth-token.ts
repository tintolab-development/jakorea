import type { AuthTokenResponse } from './types'
import { parsePortalAgeGroup } from '../lib/portal-age-group'

/**
 * flat 또는 `{ success, data }` 래핑 토큰 응답 파싱.
 * QA-0137: refreshToken은 전환기에만 본문에 온다. 없으면 undefined(HttpOnly 쿠키 `JA_MEMBER_RT`로만 refresh).
 */
export function parseAuthTokenResponse(payload: unknown): AuthTokenResponse & {
  accessToken: string
  refreshToken?: string
} {
  if (!payload || typeof payload !== 'object') {
    throw new Error('로그인 응답을 해석할 수 없습니다.')
  }

  const root = payload as Record<string, unknown>
  if (root.success === true && root.data && typeof root.data === 'object') {
    return parseAuthTokenResponse(root.data)
  }

  const accessToken = root.accessToken
  const refreshToken = root.refreshToken

  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('로그인 응답에 accessToken이 없습니다.')
  }
  return {
    accessToken: accessToken.trim(),
    // TODO(QA-0137 인프라 전환 후 삭제): 본문 refreshToken 파싱.
    refreshToken:
      typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken.trim() : undefined,
    tokenType: typeof root.tokenType === 'string' ? root.tokenType : undefined,
    expiresInSeconds:
      typeof root.expiresInSeconds === 'number' ? root.expiresInSeconds : undefined,
    passwordChangeRequired:
      typeof root.passwordChangeRequired === 'boolean'
        ? root.passwordChangeRequired
        : undefined,
    adminProvisionedOnboardingRequired:
      typeof root.adminProvisionedOnboardingRequired === 'boolean'
        ? root.adminProvisionedOnboardingRequired
        : undefined,
    adminProvisionedOnboardingStep:
      typeof root.adminProvisionedOnboardingStep === 'string'
        ? root.adminProvisionedOnboardingStep
        : undefined,
    registeredByAdmin:
      typeof root.registeredByAdmin === 'boolean' ? root.registeredByAdmin : undefined,
    identitySelfSignupCompletedAfterAdminRegistration:
      typeof root.identitySelfSignupCompletedAfterAdminRegistration === 'boolean'
        ? root.identitySelfSignupCompletedAfterAdminRegistration
        : undefined,
    ageGroup: parsePortalAgeGroup(root.ageGroup),
  }
}

export function expiresAtFromExpiresInSeconds(expiresInSeconds?: number): string | undefined {
  if (expiresInSeconds == null || expiresInSeconds <= 0) return undefined
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}
