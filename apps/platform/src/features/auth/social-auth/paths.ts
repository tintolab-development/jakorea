/** Portal 회원 SSO path SSOT (`/api/portal/auth/sso/**`, `/api/portal/me/sso/**`) */

export const portalSocialAuthPaths = {
  /** unused by portal adapter — SocialAuthPaths 필수 필드 충족용 */
  ssoLogin: () => '/api/portal/auth/sso/login',
  loginStart: (provider: string) => `/api/portal/auth/sso/login/${provider}/start`,
  ssoProviderCallback: (provider: string) =>
    `/api/portal/auth/sso/login/${provider}/callback`,
  linkProviderCallback: (provider: string) =>
    `/api/portal/me/sso/accounts/${provider}/callback`,
  loginSessionConsume: () => '/api/portal/auth/sso/login/sessions/consume',
  ssoError: () => '/api/portal/auth/sso/login/error',
  socialAccounts: () => '/api/portal/me/sso/accounts',
  socialAccount: (providerCode: string) => `/api/portal/me/sso/accounts/${providerCode}`,
  /** SocialAuthPaths 필수 — Portal 미사용 */
  signupStart: (provider: string) => `/api/portal/auth/sso/login/${provider}/start`,
  signupSession: (sessionId: number) =>
    `/api/portal/auth/sso/login/sessions/${sessionId}`,
} as const
