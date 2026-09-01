/** flat 또는 `{ success, data }` 래핑 토큰 응답 파싱 */
export function parseAuthTokenResponse(payload: unknown): {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresInSeconds?: number
  passwordChangeRequired?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  registeredByAdmin?: boolean
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
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
  if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
    throw new Error('로그인 응답에 refreshToken이 없습니다.')
  }

  return {
    accessToken: accessToken.trim(),
    refreshToken: refreshToken.trim(),
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
  }
}

export function expiresAtFromExpiresInSeconds(expiresInSeconds?: number): string | undefined {
  if (expiresInSeconds == null || expiresInSeconds <= 0) return undefined
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}
