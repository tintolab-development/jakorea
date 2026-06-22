export const adminSocialAuthPaths = {
  ssoLogin: () => '/api/admin/auth/sso/login',
  ssoCallback: () => '/api/admin/auth/sso/callback',
  signupStart: (provider: string) => `/api/auth/social/signup/${provider}/start`,
  signupSession: (sessionId: number) => `/api/auth/social/signup/sessions/${sessionId}`,
  socialAccounts: () => '/api/admin/auth/me/social-accounts',
  socialAccount: (providerCode: string) => `/api/admin/auth/me/social-accounts/${providerCode}`,
} as const
