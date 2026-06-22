import { unwrapApiData, unwrapAuthTokenResult, rethrowSocialAuthApiError } from '../api-unwrap'
import { SocialAuthApiError } from '../errors'
import { fromApiProviderCode, toApiProviderCode } from '../provider-map'
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
} from '../types'
import { buildOAuthAuthorizeUrl } from '../authorize'

export interface SocialAuthAdapter {
  startSso?(input: SsoStartInput): Promise<SsoStartResult>
  completeCallback(input: CallbackInput): Promise<AuthTokenResult>
  startSignup?(input: SocialSignupStartInput): Promise<SsoStartResult>
  fetchSignupSession?(sessionId: number): Promise<SocialVerificationSession>
  linkAccount?(input: LinkAccountInput): Promise<LinkedSocialAccount>
  listAccounts?(): Promise<LinkedSocialAccount[]>
  unlinkAccount?(provider: SocialProvider): Promise<void>
}

export interface CreateAdminSsoAdapterOptions {
  http: SocialAuthHttpClient
  paths: SocialAuthPaths
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
  const body: Record<string, unknown> = {
    provider: toApiProviderCode(input.provider),
    socialConsentVersion: input.consent.socialConsentVersion,
    socialConsentAgreed: input.consent.socialConsentAgreed,
    socialConsentSnapshotJson: input.consent.socialConsentSnapshotJson,
  }
  if (input.accessToken) {
    body.accessToken = input.accessToken
  }
  if (input.code) {
    body.code = input.code
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

export function createAdminSsoAdapter(options: CreateAdminSsoAdapterOptions): SocialAuthAdapter {
  const { http, paths } = options

  return {
    async startSso(input) {
      const { data } = await http.post<{
        authorizationUrl?: string
        state?: string
      }>(paths.ssoLogin(), {
        provider: toApiProviderCode(input.provider),
        redirectUri: input.redirectUri,
        returnUrl: input.returnUrl,
      })

      const authorizationUrl = data?.authorizationUrl
      if (!authorizationUrl) {
        throw new SocialAuthApiError('INVALID_RESPONSE', 'SSO 시작 응답에 authorizationUrl이 없습니다.')
      }

      return {
        authorizationUrl,
        state: data.state,
      }
    },

    async completeCallback(input) {
      try {
        const { data } = await http.post(paths.ssoCallback(), {
          provider: toApiProviderCode(input.provider),
          code: input.code,
          idToken: input.idToken,
          state: input.state,
        })
        return unwrapAuthTokenResult(data)
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 로그인 처리에 실패했습니다.')
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

    async listAccounts() {
      try {
        const { data } = await http.get(paths.socialAccounts())
        const payload = unwrapApiData<{ items?: unknown[]; accounts?: unknown[] } | unknown[]>(data)
        const items = Array.isArray(payload)
          ? payload
          : (payload?.items ?? payload?.accounts ?? [])

        if (!Array.isArray(items)) {
          return []
        }

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
}

export function createSignupSocialAdapter(
  options: CreateSignupSocialAdapterOptions
): SocialAuthAdapter {
  const { http, paths } = options

  return {
    async completeCallback() {
      throw new SocialAuthApiError(
        'UNSUPPORTED',
        '가입 소셜 연결은 signup return URL에서 처리해야 합니다.'
      )
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
      if (input.intent === 'link') {
        if (!signupSocial.startSignup) {
          throw new SocialAuthApiError('UNSUPPORTED', 'signup start adapter가 없습니다.')
        }
        if (!input.frontendReturnUrl) {
          throw new SocialAuthApiError('INVALID_REQUEST', 'frontendReturnUrl이 필요합니다.')
        }
        return signupSocial.startSignup({
          provider: input.provider,
          frontendReturnUrl: input.frontendReturnUrl,
        })
      }

      if (!adminSso.startSso) {
        throw new SocialAuthApiError('UNSUPPORTED', 'admin SSO start adapter가 없습니다.')
      }
      return adminSso.startSso(input)
    },

    completeCallback: input => adminSso.completeCallback(input),

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

    listAccounts: () => adminSso.listAccounts?.() ?? Promise.resolve([]),

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
