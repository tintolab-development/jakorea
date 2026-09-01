/**
 * OpenAPI `AuthTokenResponse` 파서 (login/MFA/refresh 공통).
 * envelope `{ success, data }` 와 bare DTO 모두 허용.
 */

export type ParsedAuthTokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresInSeconds?: number
  passwordChangeRequired?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  registeredByAdmin?: boolean
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}

function asRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  return payload as Record<string, unknown>
}

function unwrapData(payload: unknown): unknown {
  const o = asRecord(payload)
  if (o?.success === true && o.data && typeof o.data === 'object') {
    return o.data
  }
  return payload
}

/** access/refresh 필수. 없으면 null */
export function parseAuthTokenResponse(payload: unknown): ParsedAuthTokenResponse | null {
  const body = asRecord(unwrapData(payload))
  if (!body) return null

  const accessToken = body.accessToken
  const refreshToken = body.refreshToken
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) return null

  return {
    accessToken,
    refreshToken,
    tokenType: typeof body.tokenType === 'string' ? body.tokenType : undefined,
    expiresInSeconds:
      typeof body.expiresInSeconds === 'number' ? body.expiresInSeconds : undefined,
    passwordChangeRequired:
      typeof body.passwordChangeRequired === 'boolean'
        ? body.passwordChangeRequired
        : undefined,
    adminProvisionedOnboardingRequired:
      typeof body.adminProvisionedOnboardingRequired === 'boolean'
        ? body.adminProvisionedOnboardingRequired
        : undefined,
    adminProvisionedOnboardingStep:
      typeof body.adminProvisionedOnboardingStep === 'string'
        ? body.adminProvisionedOnboardingStep
        : undefined,
    registeredByAdmin:
      typeof body.registeredByAdmin === 'boolean' ? body.registeredByAdmin : undefined,
    identitySelfSignupCompletedAfterAdminRegistration:
      typeof body.identitySelfSignupCompletedAfterAdminRegistration === 'boolean'
        ? body.identitySelfSignupCompletedAfterAdminRegistration
        : undefined,
  }
}

export function expiresAtIsoFromExpiresInSeconds(expiresInSeconds?: number): string {
  if (expiresInSeconds != null && expiresInSeconds > 0) {
    return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  }
  return new Date(Date.now() + 60 * 60 * 1000).toISOString()
}

/** access 만료로 refresh를 시도해도 되는 401 error.code */
export function isAccessTokenUnauthorizedCode(code: string | undefined): boolean {
  if (!code) return false
  const upper = code.toUpperCase()
  return (
    upper === 'UNAUTHORIZED' ||
    upper === 'TOKEN_EXPIRED' ||
    upper === 'ACCESS_TOKEN_EXPIRED'
  )
}
