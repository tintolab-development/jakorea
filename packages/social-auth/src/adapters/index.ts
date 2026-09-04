import { unwrapApiData, unwrapAuthTokenResult, rethrowSocialAuthApiError } from '../api-unwrap'
import { SocialAuthApiError } from '../errors'
import { fromApiProviderCode, toApiProviderCode } from '../provider-map'
import { isLinkedSocialAccount } from '../social-account-status'
import type {
  AuthTokenResult,
  CallbackInput,
  LinkAccountInput,
  LinkedSocialAccount,
  OAuthClientConfig,
  SocialAuthHttpClient,
  SocialAuthPaths,
  SocialProvider,
  SocialSignupStartInput,
  SocialVerificationSession,
  SsoStartInput,
  SsoStartResult,
  AdminSsoLinkSessionInput,
} from '../types'
import { buildOAuthAuthorizeUrl } from '../authorize'
import { rewriteOAuthAuthorizationRedirectUri } from './sso-authorization-url'

export interface SocialAuthAdapter {
  startSso?(input: SsoStartInput): Promise<SsoStartResult>
  completeCallback(input: CallbackInput): Promise<AuthTokenResult>
  completeLinkSession?(input: AdminSsoLinkSessionInput): Promise<LinkedSocialAccount>
  startSignup?(input: SocialSignupStartInput): Promise<SsoStartResult>
  fetchSignupSession?(sessionId: number): Promise<SocialVerificationSession>
  linkAccount?(input: LinkAccountInput): Promise<LinkedSocialAccount>
  listAccounts?(): Promise<LinkedSocialAccount[]>
  /** API content[] 전체 — status 포함, 연결 여부는 {@link isLinkedSocialAccount}로 판별 */
  listAllSocialAccounts?(): Promise<LinkedSocialAccount[]>
  unlinkAccount?(provider: SocialProvider): Promise<void>
}

export interface CreateAdminSsoAdapterOptions {
  http: SocialAuthHttpClient
  paths: SocialAuthPaths
  /** IdP redirectUri — 백엔드 GET /api/admin/auth/sso/{provider}/callback */
  resolveBackendCallbackUri: (provider: SocialProvider) => string
}

function mapLinkedAccount(
  account: Record<string, unknown>,
  fallbackProvider: SocialProvider
): LinkedSocialAccount {
  const providerCode = typeof account.provider === 'string' ? account.provider : ''
  const mappedProvider = fromApiProviderCode(providerCode) ?? fallbackProvider

  return {
    socialAccountId:
      typeof account.socialAccountId === 'number' ? account.socialAccountId : undefined,
    provider: mappedProvider,
    providerUserIdMasked:
      typeof account.providerUserIdMasked === 'string'
        ? account.providerUserIdMasked
        : undefined,
    status: typeof account.status === 'string' ? account.status : undefined,
    linkedAt: typeof account.linkedAt === 'string' ? account.linkedAt : undefined,
  }
}

function buildLinkAccountBody(input: LinkAccountInput): Record<string, unknown> {
  const accessToken = input.accessToken ?? input.code
  if (!accessToken && !input.adminSsoSessionId) {
    throw new SocialAuthApiError('INVALID_REQUEST', 'accessToken 또는 adminSsoSessionId가 필요합니다.')
  }

  const body: Record<string, unknown> = {
    provider: toApiProviderCode(input.provider),
    socialConsentVersion: input.consent.socialConsentVersion,
    socialConsentAgreed: input.consent.socialConsentAgreed,
  }
  if (accessToken) {
    body.accessToken = accessToken
  }
  if (input.adminSsoSessionId) {
    body.adminSsoSessionId = input.adminSsoSessionId
  }
  if (input.consent.socialConsentSnapshotJson) {
    body.socialConsentSnapshotJson = input.consent.socialConsentSnapshotJson
  }
  if (input.idToken) {
    body.idToken = input.idToken
  }
  if (input.state) {
    body.state = input.state
  }
  if (input.socialVerificationSessionId) {
    body.socialVerificationSessionId = input.socialVerificationSessionId
  }
  return body
}

function extractSocialAccountItems(
  payload: { content?: unknown[]; items?: unknown[]; accounts?: unknown[] } | unknown[] | null | undefined
): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const list = payload.content ?? payload.items ?? payload.accounts ?? []
  return Array.isArray(list) ? list : []
}

function parseSocialAccountItemsFromResponse(data: unknown): LinkedSocialAccount[] {
  const payload = unwrapApiData<{
    content?: unknown[]
    items?: unknown[]
    accounts?: unknown[]
  } | unknown[]>(data)
  const items = extractSocialAccountItems(payload)

  const accounts: LinkedSocialAccount[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const providerCode = typeof o.provider === 'string' ? o.provider : ''
    const provider = fromApiProviderCode(providerCode)
    if (!provider) continue
    accounts.push(mapLinkedAccount(o, provider))
  }
  return accounts
}

type SsoAuthorizationStartPayload = {
  authorizationUrl?: string | null
  state?: string | null
  status?: string
  message?: string
}

function resolveSsoAuthorizationStartResult(
  payload: SsoAuthorizationStartPayload | null | undefined,
  redirectUri: string
): { authorizationUrl: string; state?: string } {
  const authorizationUrl =
    typeof payload?.authorizationUrl === 'string' && payload.authorizationUrl.length > 0
      ? payload.authorizationUrl
      : null

  if (!authorizationUrl) {
    const backendMessage =
      typeof payload?.message === 'string' && payload.message.length > 0
        ? payload.message
        : undefined
    const status =
      typeof payload?.status === 'string' && payload.status.length > 0
        ? payload.status
        : 'INVALID_RESPONSE'

    if (status === 'PROVIDER_REHEARSAL_REQUIRED') {
      throw new SocialAuthApiError(
        status,
        '관리자 소셜 로그인 OAuth 연동이 아직 준비되지 않았습니다. 이메일 로그인을 이용해 주세요.'
      )
    }

    throw new SocialAuthApiError(
      status,
      backendMessage ?? 'SSO 시작 응답에 authorizationUrl이 없습니다.'
    )
  }

  return {
    authorizationUrl: rewriteOAuthAuthorizationRedirectUri(authorizationUrl, redirectUri),
    state: typeof payload?.state === 'string' ? payload.state : undefined,
  }
}

export function createAdminSsoAdapter(options: CreateAdminSsoAdapterOptions): SocialAuthAdapter {
  const { http, paths, resolveBackendCallbackUri } = options

  return {
    async startSso(input) {
      try {
        const redirectUri = resolveBackendCallbackUri(input.provider)
        const returnUrl =
          input.intent === 'login'
            ? (input.loginReturnUrl ?? input.frontendReturnUrl ?? input.returnUrl)
            : (input.frontendReturnUrl ?? input.returnUrl)

        if (input.intent === 'link') {
          const { data } = await http.post(paths.socialAccounts(), {
            provider: toApiProviderCode(input.provider),
            redirectUri,
            returnUrl,
            frontendReturnUrl: input.frontendReturnUrl ?? input.returnUrl,
            startOAuth: true,
          })

          return resolveSsoAuthorizationStartResult(
            unwrapApiData<SsoAuthorizationStartPayload>(data),
            redirectUri
          )
        }

        const { data } = await http.post(paths.ssoLogin(), {
          provider: toApiProviderCode(input.provider),
          redirectUri,
          returnUrl,
        })

        return resolveSsoAuthorizationStartResult(
          unwrapApiData<SsoAuthorizationStartPayload>(data),
          redirectUri
        )
      } catch (err) {
        rethrowSocialAuthApiError(
          err,
          input.intent === 'link'
            ? '관리자 SSO 계정 연결 시작에 실패했습니다.'
            : '관리자 SSO 로그인 시작에 실패했습니다.'
        )
      }
    },

    async completeCallback(input) {
      try {
        const adminSsoSessionId = input.adminSsoSessionId ?? input.socialLoginSessionId
        if (adminSsoSessionId) {
          const { data } = await http.post(paths.loginSessionConsume(), {
            adminSsoSessionId,
          })
          return unwrapAuthTokenResult(data)
        }

        if (paths.ssoCallback) {
          const { data } = await http.post(paths.ssoCallback(), {
            provider: toApiProviderCode(input.provider),
            code: input.code,
            idToken: input.idToken,
            state: input.state,
          })
          return unwrapAuthTokenResult(data)
        }

        throw new SocialAuthApiError(
          'UNSUPPORTED',
          'adminSsoSessionId가 없어 소셜 로그인을 완료할 수 없습니다.'
        )
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 로그인 처리에 실패했습니다.')
      }
    },

    async completeLinkSession(input) {
      try {
        if (paths.linkSessionConsume) {
          const { data } = await http.post(paths.linkSessionConsume(), {
            adminSsoSessionId: input.adminSsoSessionId,
            provider: toApiProviderCode(input.provider),
            socialConsentVersion: input.consent.socialConsentVersion,
            socialConsentAgreed: input.consent.socialConsentAgreed,
            ...(input.consent.socialConsentSnapshotJson
              ? { socialConsentSnapshotJson: input.consent.socialConsentSnapshotJson }
              : {}),
          })
          const account = unwrapApiData<Record<string, unknown>>(data)
          return mapLinkedAccount(account, input.provider)
        }

        const { data } = await http.post(paths.socialAccounts(), {
          provider: toApiProviderCode(input.provider),
          adminSsoSessionId: input.adminSsoSessionId,
          socialConsentVersion: input.consent.socialConsentVersion,
          socialConsentAgreed: input.consent.socialConsentAgreed,
          ...(input.consent.socialConsentSnapshotJson
            ? { socialConsentSnapshotJson: input.consent.socialConsentSnapshotJson }
            : {}),
        })
        const account = unwrapApiData<Record<string, unknown>>(data)
        return mapLinkedAccount(account, input.provider)
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 계정 연결을 완료하지 못했습니다.')
      }
    },

    async linkAccount(input) {
      try {
        const { data } = await http.post(paths.socialAccounts(), buildLinkAccountBody(input))
        const account = unwrapApiData<Record<string, unknown>>(data)
        return mapLinkedAccount(account, input.provider)
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 계정 연결에 실패했습니다.')
      }
    },

    async listAllSocialAccounts() {
      try {
        const { data } = await http.get(paths.socialAccounts())
        return parseSocialAccountItemsFromResponse(data)
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 계정 목록 조회에 실패했습니다.')
      }
    },

    async listAccounts() {
      try {
        const { data } = await http.get(paths.socialAccounts())
        return parseSocialAccountItemsFromResponse(data).filter(isLinkedSocialAccount)
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 계정 목록 조회에 실패했습니다.')
      }
    },

    async unlinkAccount(provider) {
      try {
        await http.delete(paths.socialAccount(toApiProviderCode(provider)))
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 계정 연결 해제에 실패했습니다.')
      }
    },
  }
}

export interface CreateSignupSocialAdapterOptions {
  http: SocialAuthHttpClient
  paths: SocialAuthPaths
  /** IdP redirectUri — 백엔드 GET /api/admin/auth/sso/{provider}/callback */
  resolveBackendCallbackUri?: (provider: SocialProvider) => string
}

export function createSignupSocialAdapter(
  options: CreateSignupSocialAdapterOptions
): SocialAuthAdapter {
  const { http, paths, resolveBackendCallbackUri } = options

  return {
    async completeCallback() {
      throw new SocialAuthApiError(
        'UNSUPPORTED',
        '가입 소셜 연결은 signup return URL에서 처리해야 합니다.'
      )
    },

    async startSso(input) {
      if (!paths.signupSsoLinkStart) {
        throw new SocialAuthApiError(
          'UNSUPPORTED',
          '가입 직후 소셜 연결 시작 API가 설정되지 않았습니다.'
        )
      }
      if (!input.signupSocialLinkToken?.trim()) {
        throw new SocialAuthApiError(
          'INVALID_REQUEST',
          'signupSocialLinkToken이 없어 소셜 계정 연결을 시작할 수 없습니다.'
        )
      }

      try {
        const redirectUri = resolveBackendCallbackUri
          ? resolveBackendCallbackUri(input.provider)
          : input.redirectUri
        const returnUrl = input.frontendReturnUrl ?? input.returnUrl

        const { data } = await http.post(paths.signupSsoLinkStart(), {
          provider: toApiProviderCode(input.provider),
          redirectUri,
          returnUrl,
          signupSocialLinkToken: input.signupSocialLinkToken,
        })

        return resolveSsoAuthorizationStartResult(
          unwrapApiData<SsoAuthorizationStartPayload>(data),
          redirectUri
        )
      } catch (err) {
        rethrowSocialAuthApiError(err, '가입 직후 소셜 계정 연결 시작에 실패했습니다.')
      }
    },

    async completeLinkSession(input) {
      if (!paths.signupSsoLinkSessionConsume) {
        throw new SocialAuthApiError(
          'UNSUPPORTED',
          '가입 직후 소셜 연결 완료 API가 설정되지 않았습니다.'
        )
      }
      if (!input.signupSocialLinkToken?.trim()) {
        throw new SocialAuthApiError(
          'INVALID_REQUEST',
          'signupSocialLinkToken이 없어 소셜 계정 연결을 완료할 수 없습니다.'
        )
      }

      try {
        const { data } = await http.post(paths.signupSsoLinkSessionConsume(), {
          adminSsoSessionId: input.adminSsoSessionId,
          provider: toApiProviderCode(input.provider),
          signupSocialLinkToken: input.signupSocialLinkToken,
          socialConsentVersion: input.consent.socialConsentVersion,
          socialConsentAgreed: input.consent.socialConsentAgreed,
          ...(input.consent.socialConsentSnapshotJson
            ? { socialConsentSnapshotJson: input.consent.socialConsentSnapshotJson }
            : {}),
        })
        const account = unwrapApiData<Record<string, unknown>>(data)
        return mapLinkedAccount(account, input.provider)
      } catch (err) {
        rethrowSocialAuthApiError(err, '가입 직후 소셜 계정 연결을 완료하지 못했습니다.')
      }
    },

    async startSignup(input) {
      const { data } = await http.post<{
        authorizationUrl?: string
        provider?: string
        expiresAt?: string
      }>(paths.signupStart(input.provider), {
        frontendReturnUrl: input.frontendReturnUrl,
      })

      const authorizationUrl = data?.authorizationUrl
      if (!authorizationUrl) {
        throw new SocialAuthApiError(
          'INVALID_RESPONSE',
          '소셜 가입 시작 응답에 authorizationUrl이 없습니다.'
        )
      }

      return { authorizationUrl }
    },

    async fetchSignupSession(sessionId) {
      try {
        const { data } = await http.get(paths.signupSession(sessionId))
        const session = unwrapApiData<Record<string, unknown>>(data)
        const providerCode = typeof session.provider === 'string' ? session.provider : ''
        const provider = fromApiProviderCode(providerCode)
        if (!provider) {
          throw new SocialAuthApiError('INVALID_RESPONSE', '소셜 인증 세션 provider가 올바르지 않습니다.')
        }

        const sessionIdValue =
          typeof session.socialVerificationSessionId === 'number'
            ? session.socialVerificationSessionId
            : sessionId

        return {
          socialVerificationSessionId: sessionIdValue,
          provider,
          email: typeof session.email === 'string' ? session.email : undefined,
          displayName: typeof session.displayName === 'string' ? session.displayName : undefined,
          status: typeof session.status === 'string' ? session.status : undefined,
          expiresAt: typeof session.expiresAt === 'string' ? session.expiresAt : undefined,
        }
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 인증 세션 조회에 실패했습니다.')
      }
    },
  }
}

export interface CreateCompositeRemoteAdapterOptions {
  adminSso: SocialAuthAdapter
  signupSocial: SocialAuthAdapter
}

export function createCompositeRemoteAdapter(
  options: CreateCompositeRemoteAdapterOptions
): SocialAuthAdapter {
  const { adminSso, signupSocial } = options

  return {
    async startSso(input) {
      if (input.intent === 'link' && input.signupSocialLinkToken) {
        if (!signupSocial.startSso) {
          throw new SocialAuthApiError('UNSUPPORTED', 'signup SSO start adapter가 없습니다.')
        }
        return signupSocial.startSso(input)
      }

      if (!adminSso.startSso) {
        throw new SocialAuthApiError('UNSUPPORTED', 'admin SSO start adapter가 없습니다.')
      }
      return adminSso.startSso(input)
    },

    completeCallback: input => adminSso.completeCallback(input),

    completeLinkSession: input => {
      if (input.signupSocialLinkToken) {
        if (!signupSocial.completeLinkSession) {
          throw new SocialAuthApiError('UNSUPPORTED', 'signup completeLinkSession adapter가 없습니다.')
        }
        return signupSocial.completeLinkSession(input)
      }

      if (!adminSso.completeLinkSession) {
        throw new SocialAuthApiError('UNSUPPORTED', 'completeLinkSession adapter가 없습니다.')
      }
      return adminSso.completeLinkSession(input)
    },

    fetchSignupSession: sessionId => {
      if (!signupSocial.fetchSignupSession) {
        throw new SocialAuthApiError('UNSUPPORTED', 'signup session adapter가 없습니다.')
      }
      return signupSocial.fetchSignupSession(sessionId)
    },

    linkAccount: input => {
      if (!adminSso.linkAccount) {
        throw new SocialAuthApiError('UNSUPPORTED', 'linkAccount adapter가 없습니다.')
      }
      return adminSso.linkAccount(input)
    },

    listAccounts: async () => {
      const all = await adminSso.listAllSocialAccounts?.()
      if (!all) return []
      return all.filter(isLinkedSocialAccount)
    },

    listAllSocialAccounts: () => adminSso.listAllSocialAccounts?.() ?? Promise.resolve([]),

    unlinkAccount: provider => adminSso.unlinkAccount?.(provider) ?? Promise.resolve(),
  }
}

export interface MockSocialAuthLoginResult extends AuthTokenResult {
  user?: unknown
  requiresMfa?: boolean
}

export interface CreateMockSocialAuthAdapterOptions {
  oauthConfig: OAuthClientConfig
  callbackPath: string
  createOAuthState: (provider: SocialProvider) => string
  /** mock 로그인 시 CMS auth-service 등 앱 레이어 위임 */
  mockLogin?: (input: CallbackInput) => Promise<MockSocialAuthLoginResult>
}

export function createMockSocialAuthAdapter(
  options: CreateMockSocialAuthAdapterOptions
): SocialAuthAdapter {
  const { oauthConfig, callbackPath, createOAuthState, mockLogin } = options

  return {
    async startSso(input) {
      const oauthState = createOAuthState(input.provider)
      return {
        authorizationUrl: buildOAuthAuthorizeUrl(
          oauthConfig,
          callbackPath,
          input.provider,
          oauthState
        ),
        state: oauthState,
      }
    },

    async completeCallback(input) {
      if (mockLogin) {
        const result = await mockLogin(input)
        return {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          tokenType: result.tokenType,
          expiresInSeconds: result.expiresInSeconds,
        }
      }

      const { SocialAccountNotLinkedError } = await import('../errors')
      throw new SocialAccountNotLinkedError()
    },
  }
}
