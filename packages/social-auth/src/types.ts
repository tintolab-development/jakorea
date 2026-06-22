export type SocialProvider = 'kakao' | 'naver' | 'google'

export type SocialProviderCode = 'KAKAO' | 'NAVER' | 'GOOGLE'

export type OAuthIntent = 'login' | 'link'

export interface SocialAuthPaths {
  ssoLogin: () => string
  ssoCallback: () => string
  socialAccounts: () => string
  socialAccount: (providerCode: string) => string
  signupStart: (provider: string) => string
  signupSession: (sessionId: number) => string
  /** 회원(Platform) 확장용 */
  loginStart?: (provider: string) => string
  loginSessionConsume?: () => string
  memberSocialLogin?: () => string
  memberSocialAccounts?: () => string
  memberSocialAccount?: (providerCode: string) => string
}

export interface SocialAuthRoutes {
  /** `/oauth/{provider}` — `{provider}` 플레이스홀더 포함 (관리자 로그인) */
  callbackPath: string
  /** 가입·연결 OAuth 완료 후 프론트 return URL 경로 */
  signupReturnPath: string
}

export interface SocialAuthHttpClient {
  post: <T = unknown>(url: string, body?: unknown) => Promise<{ data: T }>
  get: <T = unknown>(url: string) => Promise<{ data: T }>
  delete: <T = unknown>(url: string) => Promise<{ data: T }>
}

export interface AuthTokenResult {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresInSeconds?: number
}

export interface SocialLinkConsent {
  socialConsentVersion: string
  socialConsentAgreed: boolean
  socialConsentSnapshotJson?: string
}

export interface LinkedSocialAccount {
  socialAccountId?: number
  provider: SocialProvider
  providerUserIdMasked?: string
  status?: string
  linkedAt?: string
}

export interface SocialSignupStartInput {
  provider: SocialProvider
  frontendReturnUrl: string
}

export interface SocialVerificationSession {
  socialVerificationSessionId: number
  provider: SocialProvider
  email?: string
  displayName?: string
  status?: string
  expiresAt?: string
}

export interface SsoStartInput {
  provider: SocialProvider
  intent: OAuthIntent
  redirectUri: string
  returnUrl?: string
  frontendReturnUrl?: string
}

export interface SsoStartResult {
  authorizationUrl: string
  state?: string
}

export interface CallbackInput {
  provider: SocialProvider
  intent: OAuthIntent
  code?: string
  idToken?: string
  state?: string
}

export interface LinkAccountInput {
  provider: SocialProvider
  code?: string
  idToken?: string
  state?: string
  accessToken?: string
  socialVerificationSessionId?: number
  consent: SocialLinkConsent
}

export interface OAuthClientConfig {
  clientIds: Record<SocialProvider, string | undefined>
  resolveOrigin?: () => string
}

export interface PendingSocialLink {
  provider: SocialProvider
  code?: string
  state?: string
  socialVerificationSessionId?: number
  consent?: SocialLinkConsent
}

export type OAuthCallbackOutcome =
  | { kind: 'authenticated'; tokens: AuthTokenResult; user?: unknown }
  | {
      kind: 'linked'
      provider: SocialProvider
      account?: LinkedSocialAccount
      session?: SocialVerificationSession
      pending?: boolean
    }
  | { kind: 'not_linked' }
  | { kind: 'already_linked' }
  | { kind: 'failed'; message: string }
  | { kind: 'cancelled' }

export type SignupSocialReturnOutcome =
  | {
      kind: 'linked'
      provider: SocialProvider
      session: SocialVerificationSession
      account?: LinkedSocialAccount
      pending?: boolean
    }
  | { kind: 'failed'; message: string }
  | { kind: 'cancelled' }
