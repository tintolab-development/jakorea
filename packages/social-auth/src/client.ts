import type { SocialAuthAdapter } from './adapters'
import { buildOAuthAuthorizeUrl, getOAuthRedirectUri } from './authorize'
import { SocialAuthApiError } from './errors'
import type { SocialAuthState } from './state'
import { createSocialAuthState } from './state'
import type {
  CallbackInput,
  LinkAccountInput,
  OAuthClientConfig,
  OAuthIntent,
  AdminSsoLinkSessionInput,
  SocialAuthHttpClient,
  SocialAuthPaths,
  SocialAuthRoutes,
  SocialProvider,
  SocialVerificationSession,
} from './types'

export interface CreateSocialAuthClientOptions {
  http: SocialAuthHttpClient
  paths: SocialAuthPaths
  routes: SocialAuthRoutes
  oauthConfig: OAuthClientConfig
  isRemoteEnabled: (intent?: OAuthIntent) => boolean
  remoteAdapter: SocialAuthAdapter
  mockAdapter: SocialAuthAdapter
  /** mock adapter 전용 — remote는 백엔드 SSO start 사용 */
  useFrontendOAuthStart?: (intent?: OAuthIntent) => boolean
  storagePrefix?: string
  state?: SocialAuthState
  getAccessToken?: () => string | null
}

export interface SocialAuthClient {
  readonly state: SocialAuthState
  readonly routes: SocialAuthRoutes
  readonly oauthConfig: OAuthClientConfig
  isRemoteEnabled: (intent?: OAuthIntent) => boolean
  hasAccessToken: () => boolean
  getRedirectUri: (provider: SocialProvider) => string
  buildLoginReturnUrl: () => string
  buildSignupReturnUrl: (returnUrl?: string) => string
  startLogin: (input: {
    provider: SocialProvider
    intent: OAuthIntent
    returnUrl?: string
    signupSocialLinkToken?: string
  }) => Promise<string>
  completeCallback: (input: CallbackInput) => ReturnType<SocialAuthAdapter['completeCallback']>
  completeLinkSession: (
    input: AdminSsoLinkSessionInput
  ) => ReturnType<NonNullable<SocialAuthAdapter['completeLinkSession']>>
  fetchSignupSession: (sessionId: number) => Promise<SocialVerificationSession>
  linkAccount: (input: LinkAccountInput) => Promise<import('./types').LinkedSocialAccount>
  listAccounts: () => Promise<import('./types').LinkedSocialAccount[]>
  listAllSocialAccounts: () => Promise<import('./types').LinkedSocialAccount[]>
  unlinkAccount: (provider: SocialProvider) => Promise<void>
  flushPendingLinks: (consent: import('./types').SocialLinkConsent) => Promise<void>
}

function resolveAdapter(
  client: {
    isRemoteEnabled: (intent?: OAuthIntent) => boolean
    remoteAdapter: SocialAuthAdapter
    mockAdapter: SocialAuthAdapter
  },
  intent?: OAuthIntent
): SocialAuthAdapter {
  const effectiveIntent = intent ?? 'link'
  return client.isRemoteEnabled(effectiveIntent) ? client.remoteAdapter : client.mockAdapter
}

function resolveOrigin(oauthConfig: OAuthClientConfig): string {
  if (oauthConfig.resolveOrigin) {
    return oauthConfig.resolveOrigin()
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://localhost:3000'
}

function shouldFallbackToFrontendOAuthStart(error: unknown): boolean {
  if (!(error instanceof SocialAuthApiError)) {
    return false
  }
  return (
    error.code === 'PROVIDER_REHEARSAL_REQUIRED' ||
    error.code === 'INVALID_RESPONSE' ||
    error.message.includes('authorizationUrl')
  )
}

export function createSocialAuthClient(options: CreateSocialAuthClientOptions): SocialAuthClient {
  const state = options.state ?? createSocialAuthState({ storagePrefix: options.storagePrefix })
  const clientShell = {
    isRemoteEnabled: options.isRemoteEnabled,
    remoteAdapter: options.remoteAdapter,
    mockAdapter: options.mockAdapter,
  }

  const getRedirectUri = (provider: SocialProvider) =>
    getOAuthRedirectUri(options.oauthConfig, options.routes.callbackPath, provider)

  const buildLoginReturnUrl = () => {
    const origin = resolveOrigin(options.oauthConfig)
    const path = options.routes.loginCompletePath ?? '/login/social/complete'
    return `${origin}${path}`
  }

  const buildSignupReturnUrl = (returnUrl?: string) => {
    const origin = resolveOrigin(options.oauthConfig)
    const path = options.routes.signupReturnPath
    if (!returnUrl) {
      return `${origin}${path}`
    }
    const params = new URLSearchParams({ redirect: returnUrl })
    return `${origin}${path}?${params.toString()}`
  }

  return {
    state,
    routes: options.routes,
    oauthConfig: options.oauthConfig,
    isRemoteEnabled: options.isRemoteEnabled,
    hasAccessToken: () => Boolean(options.getAccessToken?.()),
    getRedirectUri,
    buildLoginReturnUrl,
    buildSignupReturnUrl,

    async startLogin({ provider, intent, returnUrl, signupSocialLinkToken }) {
      state.setOAuthIntent(intent, returnUrl)
      const adapter = resolveAdapter(clientShell, intent)
      const loginReturnUrl = buildLoginReturnUrl()
      const frontendReturnUrl =
        intent === 'login' ? loginReturnUrl : buildSignupReturnUrl(returnUrl)

      const buildFrontendAuthorizeUrl = () => {
        const oauthState = state.createOAuthState(provider)
        return buildOAuthAuthorizeUrl(
          options.oauthConfig,
          options.routes.callbackPath,
          provider,
          oauthState
        )
      }

      const useFrontendStart =
        options.useFrontendOAuthStart?.(intent) ?? !clientShell.isRemoteEnabled(intent)

      if (useFrontendStart) {
        return buildFrontendAuthorizeUrl()
      }

      if (adapter.startSso) {
        try {
          const result = await adapter.startSso({
            provider,
            intent,
            redirectUri: getRedirectUri(provider),
            returnUrl,
            frontendReturnUrl,
            loginReturnUrl,
            signupSocialLinkToken,
          })
          if (result.state) {
            state.storeOAuthState(provider, result.state)
          }
          return result.authorizationUrl
        } catch (error: unknown) {
          if (!signupSocialLinkToken && shouldFallbackToFrontendOAuthStart(error)) {
            if (typeof console !== 'undefined' && console.warn) {
              console.warn(
                '[social-auth] Admin SSO start unavailable; using frontend Kakao/Naver/Google authorize URL.',
                error instanceof Error ? error.message : error
              )
            }
            return buildFrontendAuthorizeUrl()
          }
          throw error
        }
      }

      return buildFrontendAuthorizeUrl()
    },

    completeCallback(input) {
      return resolveAdapter(clientShell, input.intent).completeCallback(input)
    },

    completeLinkSession(input) {
      const adapter = resolveAdapter(clientShell, 'link')
      if (!adapter.completeLinkSession) {
        throw new Error('현재 adapter는 completeLinkSession을 지원하지 않습니다.')
      }
      return adapter.completeLinkSession(input)
    },

    fetchSignupSession(sessionId) {
      const adapter = resolveAdapter(clientShell, 'link')
      if (!adapter.fetchSignupSession) {
        throw new Error('현재 adapter는 fetchSignupSession을 지원하지 않습니다.')
      }
      return adapter.fetchSignupSession(sessionId)
    },

    async linkAccount(input) {
      const adapter = resolveAdapter(clientShell, 'link')
      if (!adapter.linkAccount) {
        throw new Error('현재 adapter는 linkAccount를 지원하지 않습니다.')
      }
      return adapter.linkAccount(input)
    },

    async listAccounts() {
      const adapter = resolveAdapter(clientShell, 'link')
      if (!adapter.listAccounts) {
        return []
      }
      return adapter.listAccounts()
    },

    async listAllSocialAccounts() {
      const adapter = resolveAdapter(clientShell, 'link')
      if (!adapter.listAllSocialAccounts) {
        return adapter.listAccounts?.() ?? []
      }
      return adapter.listAllSocialAccounts()
    },

    async unlinkAccount(provider) {
      const adapter = resolveAdapter(clientShell, 'link')
      if (!adapter.unlinkAccount) {
        return
      }
      await adapter.unlinkAccount(provider)
    },

    async flushPendingLinks(consent) {
      const token = options.getAccessToken?.()
      if (!token) {
        return
      }

      const pending = state.getPendingSocialLinks()
      if (pending.length === 0) {
        return
      }

      const adapter = resolveAdapter(clientShell, 'link')
      if (!adapter.linkAccount) {
        return
      }

      for (const link of pending) {
        try {
          await adapter.linkAccount({
            provider: link.provider,
            accessToken: link.code,
            state: link.state,
            socialVerificationSessionId: link.socialVerificationSessionId,
            consent: link.consent ?? consent,
          })
          state.removePendingSocialLink(link.provider)
          state.addConnectedProvider(link.provider)
        } catch {
          // 개별 pending link 실패는 무시하고 다음 항목 시도
        }
      }
    },
  }
}
