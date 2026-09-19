import { unwrapApiData, unwrapAuthTokenResult, rethrowSocialAuthApiError } from '../api-unwrap'
import { SocialAuthApiError } from '../errors'
import { fromApiProviderCode, toApiProviderCode } from '../provider-map'
import { isLinkedSocialAccount } from '../social-account-status'
import type {
  LinkedSocialAccount,
  SocialAuthHttpClient,
  SocialAuthPaths,
  SocialProvider,
} from '../types'
import { rewriteOAuthAuthorizationRedirectUri } from './sso-authorization-url'

type SocialAuthAdapter = import('./index').SocialAuthAdapter

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
        '회원 소셜 로그인 OAuth 연동이 아직 준비되지 않았습니다. 이메일 로그인을 이용해 주세요.'
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

function providerPathSegment(provider: SocialProvider): string {
  return toApiProviderCode(provider).toLowerCase()
}

export interface CreatePortalSsoAdapterOptions {
  http: SocialAuthHttpClient
  paths: SocialAuthPaths
  /**
   * IdP redirectUri — login: GET /api/portal/auth/sso/login/{provider}/callback
   * link: GET /api/portal/me/sso/accounts/{provider}/callback
   */
  resolveBackendCallbackUri: (provider: SocialProvider, intent: 'login' | 'link') => string
}

/**
 * Portal(회원) SSO — OpenAPI `/api/portal/auth/sso/**` + `/api/portal/me/sso/**`.
 * Admin SSO와 경로·body 필드(`socialLoginSessionId`, `frontendReturnUrl`)가 다르다.
 */
export function createPortalSsoAdapter(options: CreatePortalSsoAdapterOptions): SocialAuthAdapter {
  const { http, paths, resolveBackendCallbackUri } = options

  return {
    async startSso(input) {
      try {
        const redirectUri = resolveBackendCallbackUri(input.provider, input.intent)
        const frontendReturnUrl =
          input.intent === 'login'
            ? (input.loginReturnUrl ?? input.frontendReturnUrl ?? input.returnUrl)
            : (input.frontendReturnUrl ?? input.returnUrl)

        if (!frontendReturnUrl) {
          throw new SocialAuthApiError(
            'INVALID_REQUEST',
            'frontendReturnUrl이 없어 소셜 인증을 시작할 수 없습니다.'
          )
        }

        const providerSeg = providerPathSegment(input.provider)

        if (input.intent === 'link') {
          const startPath = `${paths.socialAccounts().replace(/\/$/, '')}/${providerSeg}/start`
          const { data } = await http.post(startPath, {
            frontendReturnUrl,
            socialConsentVersion: '1.0',
            socialConsentAgreed: true,
          })

          return resolveSsoAuthorizationStartResult(
            unwrapApiData<SsoAuthorizationStartPayload>(data),
            redirectUri
          )
        }

        const loginStartPath = paths.loginStart
          ? paths.loginStart(providerSeg)
          : `${paths.ssoLogin().replace(/\/$/, '')}/${providerSeg}/start`

        const { data } = await http.post(loginStartPath, {
          frontendReturnUrl,
        })

        return resolveSsoAuthorizationStartResult(
          unwrapApiData<SsoAuthorizationStartPayload>(data),
          redirectUri
        )
      } catch (err) {
        rethrowSocialAuthApiError(
          err,
          input.intent === 'link'
            ? '회원 SSO 계정 연결 시작에 실패했습니다.'
            : '회원 SSO 로그인 시작에 실패했습니다.'
        )
      }
    },

    async completeCallback(input) {
      try {
        const socialLoginSessionId = input.socialLoginSessionId ?? input.adminSsoSessionId
        if (!socialLoginSessionId) {
          throw new SocialAuthApiError(
            'UNSUPPORTED',
            'socialLoginSessionId가 없어 소셜 로그인을 완료할 수 없습니다.'
          )
        }

        const { data } = await http.post(paths.loginSessionConsume(), {
          socialLoginSessionId,
        })
        return unwrapAuthTokenResult(data)
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 로그인 처리에 실패했습니다.')
      }
    },

    async linkAccount(input) {
      try {
        const accessToken = input.accessToken ?? input.code
        const body: Record<string, unknown> = {
          provider: toApiProviderCode(input.provider),
          socialConsentVersion: input.consent.socialConsentVersion,
          socialConsentAgreed: input.consent.socialConsentAgreed,
        }
        if (accessToken) {
          body.accessToken = accessToken
        }
        if (input.idToken) {
          body.idToken = input.idToken
        }
        if (input.consent.socialConsentSnapshotJson) {
          body.socialConsentSnapshotJson = input.consent.socialConsentSnapshotJson
        }

        const { data } = await http.post(paths.socialAccounts(), body)
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
        await http.delete(paths.socialAccount(providerPathSegment(provider)))
      } catch (err) {
        rethrowSocialAuthApiError(err, '소셜 계정 연결 해제에 실패했습니다.')
      }
    },
  }
}
