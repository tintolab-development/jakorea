export type SocialProvider = 'kakao' | 'naver' | 'google'

export type SocialProviderCode = 'KAKAO' | 'NAVER' | 'GOOGLE'

export type OAuthIntent = 'login' | 'link'

export interface SocialAuthPaths {
  ssoLogin: () => string
  ssoProviderCallback: (provider: string) => string
  loginSessionConsume: () => string
  /** Admin SSO link callback 후 one-time session 소비 */
  linkSessionConsume?: () => string
  /** @deprecated canonical 아님 — remote adapter 미사용 */
  ssoCallback?: () => string
  socialAccounts: () => string
  socialAccount: (providerCode: string) => string
  signupStart: (provider: string) => string
  signupSession: (sessionId: number) => string
  /** 가입 직후 public 소셜 연결 시작 */
  signupSsoLinkStart?: () => string
  /** 가입 직후 public 소셜 연결 session consume */
  signupSsoLinkSessionConsume?: () => string
  ssoError?: () => string
  /**
   * Portal SSO login start — `POST /api/portal/auth/sso/login/{provider}/start`
   * provider path segment는 보통 소문자(kakao|naver|google)
   */
  loginStart?: (provider: string) => string
  /** @deprecated Portal은 createPortalSsoAdapter + loginStart / socialAccounts 사용 */
  memberSocialLogin?: () => string
  memberSocialAccounts?: () => string
  memberSocialAccount?: (providerCode: string) => string
}

export interface SocialAuthRoutes {
  /** `/oauth/{provider}` — `{provider}` 플레이스홀더 포함 (mock 전용) */
  callbackPath: string
  /** 가입·연결 OAuth 완료 후 프론트 return URL 경로 */
  signupReturnPath: string
  /** Admin SSO login 완료 return URL 경로 (remote) */
  loginCompletePath?: string
}

export interface SocialAuthHttpClient {
  post: <T = unknown>(url: string, body?: unknown) => Promise<{ data: T }>
  get: <T = unknown>(url: string) => Promise<{ data: T }>
  delete: <T = unknown>(url: string) => Promise<{ data: T }>
}

export interface AuthTokenResult {
  accessToken: string
  /**
   * QA-0137 전환기에만 본문에 온다. 운영 `JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false`면 없고
   * HttpOnly 쿠키(`JA_ADMIN_RT` / `JA_MEMBER_RT`)로만 받는다. 없으면 앱이 쿠키 세션으로 전환한다.
   * TODO(QA-0137 인프라 전환 후 삭제): 필드 제거.
   */
  refreshToken?: string
  tokenType?: string
  expiresInSeconds?: number
  /** 회원 포털 토큰만. `UNDER_14` | `OVER_14`. 관리자 SSO는 없음. */
  ageGroup?: 'UNDER_14' | 'OVER_14'
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
  loginReturnUrl?: string
  /** 가입 직후 public handoff — 있으면 `/api/admin/auth/signup/sso/link/start` */
  signupSocialLinkToken?: string
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
  /** @deprecated Admin SSO login uses `adminSsoSessionId` (OpenAPI AdminSsoSessionConsumeRequest). */
  socialLoginSessionId?: string
  adminSsoSessionId?: string
}

export interface LinkAccountInput {
  provider: SocialProvider
  code?: string
  idToken?: string
  state?: string
  accessToken?: string
  adminSsoSessionId?: string
  socialVerificationSessionId?: number
  consent: SocialLinkConsent
}

export interface AdminSsoLinkSessionInput {
  provider: SocialProvider
  adminSsoSessionId: string
  consent: SocialLinkConsent
  /** 가입 직후 public consume — 있으면 `/api/admin/auth/signup/sso/link/sessions/consume` */
  signupSocialLinkToken?: string
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

/** POST /api/admin/auth/sso/login/sessions/consume 200 — AdminMfaChallengeResponse */
export interface SocialLoginMfaChallenge {
  challengeUuid: string
  mfaMethod?: string
  expiresAt?: string
  /** true면 QR 등록, false면 기존 OTP만 입력. 로그인 응답의 QR/Secret은 쓰지 않는다. */
  mfaSetupRequired?: boolean
  totpSecret?: string
  otpauthUri?: string
  qrDataUrl?: string
  /** 계정 단위 MFA 연속 실패 횟수(서버 누적값) */
  failedAttemptCount?: number
  /** 잠금 전까지 허용되는 MFA 연속 실패 횟수 */
  maxFailedAttempts?: number
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
  | {
      kind: 'mfa_required'
      challengeUuid: string
      mfaMethod?: string
      expiresAt?: string
      mfaSetupRequired?: boolean
      failedAttemptCount?: number
      maxFailedAttempts?: number
      totpSecret?: string
      otpauthUri?: string
      qrDataUrl?: string
    }
  | { kind: 'failed'; message: string }
  | { kind: 'cancelled' }

export type SignupSocialReturnOutcome =
  | {
      kind: 'linked'
      provider: SocialProvider
      session?: SocialVerificationSession
      account?: LinkedSocialAccount
      pending?: boolean
    }
  | { kind: 'failed'; message: string }
  | { kind: 'cancelled' }

export type OAuthLinkCallbackOutcome = SignupSocialReturnOutcome
