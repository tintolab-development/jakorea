export const adminSocialAuthPaths = {
  ssoLogin: () => '/api/admin/auth/sso/login',
  ssoCallback: () => '/api/admin/auth/sso/callback',
  /** @deprecated Swagger에 없음 — mock 전용. 실 API link는 admin SSO login + POST sso/accounts */
  signupStart: (provider: string) => `/api/auth/social/signup/${provider}/start`,
  /** @deprecated Swagger에 없음 — mock 전용 */
  signupSession: (sessionId: number) => `/api/auth/social/signup/sessions/${sessionId}`,
  socialAccounts: () => '/api/admin/me/sso/accounts',
  socialAccount: (providerCode: string) => `/api/admin/me/sso/accounts/${providerCode}`,
} as const
