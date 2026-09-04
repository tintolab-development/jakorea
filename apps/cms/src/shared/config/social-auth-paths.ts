export const adminSocialAuthPaths = {
  ssoLogin: () => '/api/admin/auth/sso/login',
  ssoProviderCallback: (provider: string) => `/api/admin/auth/sso/${provider}/callback`,
  loginSessionConsume: () => '/api/admin/auth/sso/login/sessions/consume',
  linkSessionConsume: () => '/api/admin/me/sso/link/sessions/consume',
  ssoError: () => '/api/admin/auth/sso/error',
  /** @deprecated canonical 아님 — remote adapter 미사용 */
  ssoCallback: () => '/api/admin/auth/sso/callback',
  /** @deprecated Swagger에 없음 — mock 전용. 실 API link는 admin SSO login + returnUrl */
  signupStart: (provider: string) => `/api/auth/social/signup/${provider}/start`,
  /** @deprecated Swagger에 없음 — mock 전용 */
  signupSession: (sessionId: number) => `/api/auth/social/signup/sessions/${sessionId}`,
  socialAccounts: () => '/api/admin/me/sso/accounts',
  socialAccount: (providerCode: string) => `/api/admin/me/sso/accounts/${providerCode}`,
} as const
