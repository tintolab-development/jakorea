import type { SocialAuthClient } from './client'
import {
  isSocialAccountAlreadyLinkedError,
  isSocialAccountNotLinkedError,
  SocialAccountAlreadyLinkedError,
  SocialAccountNotLinkedError,
} from './errors'
import { fromApiProviderCode, isSocialProvider } from './provider-map'
import type {
  OAuthCallbackOutcome,
  OAuthLinkCallbackOutcome,
  SignupSocialReturnOutcome,
  SocialLinkConsent,
  SocialProvider,
} from './types'

export interface ProcessOAuthCallbackOptions {
  cancelled?: boolean
}

export interface ProcessSignupSocialReturnOptions {
  cancelled?: boolean
  consent?: SocialLinkConsent
}

const SIGNUP_SESSION_FAILURE_STATUSES = new Set(['FAILED', 'EXPIRED', 'CANCELLED', 'REVOKED'])

function isSignupSessionReady(status?: string): boolean {
  if (!status) {
    return true
  }
  const normalized = status.trim().toUpperCase()
  if (SIGNUP_SESSION_FAILURE_STATUSES.has(normalized)) {
    return false
  }
  return true
}

/** Admin SSO login — backend callback 후 `/login/social/complete?adminSsoSessionId=...` */
export async function processSocialLoginSessionReturn(
  client: SocialAuthClient,
  searchParams: URLSearchParams
): Promise<OAuthCallbackOutcome> {
  const error = searchParams.get('error')
  const challengeUuid = searchParams.get('challengeUuid') ?? searchParams.get('mfaChallengeUuid')
  const status = searchParams.get('status')?.trim().toUpperCase() ?? ''

  if (challengeUuid) {
    return {
      kind: 'mfa_required',
      challengeUuid,
      mfaMethod: searchParams.get('mfaMethod') ?? undefined,
    }
  }

  if (error) {
    const cancelled = error === 'access_denied' || error === 'user_cancelled'
    if (cancelled) {
      return { kind: 'cancelled' }
    }
    const normalizedError = error.trim().toUpperCase()
    if (
      normalizedError === 'ADMIN_SOCIAL_ACCOUNT_NOT_LINKED' ||
      normalizedError === 'SOCIAL_ACCOUNT_NOT_LINKED'
    ) {
      return { kind: 'not_linked' }
    }
    if (
      normalizedError === 'SOCIAL_ACCOUNT_ALREADY_LINKED_TO_OTHER_MEMBER' ||
      normalizedError === 'SOCIAL_ACCOUNT_ALREADY_LINKED' ||
      normalizedError === 'SOCIAL_ACCOUNT_ALREADY_CONNECTED' ||
      normalizedError.includes('ALREADY_LINKED')
    ) {
      return { kind: 'already_linked' }
    }
    return {
      kind: 'failed',
      message:
        searchParams.get('error_description') ??
        searchParams.get('message') ??
        error,
    }
  }

  if (status === 'FAILED' || status === 'ERROR') {
    return {
      kind: 'failed',
      message:
        searchParams.get('error_description') ??
        searchParams.get('message') ??
        '소셜 로그인에 실패했습니다.',
    }
  }

  // OpenAPI AdminSsoSessionConsumeRequest: adminSsoSessionId.
  // socialLoginSessionId는 구버전/포털 네이밍 하위 호환.
  const adminSsoSessionId =
    searchParams.get('adminSsoSessionId') ?? searchParams.get('socialLoginSessionId')
  if (!adminSsoSessionId) {
    return {
      kind: 'failed',
      message: 'adminSsoSessionId가 없어 로그인을 완료할 수 없습니다.',
    }
  }

  try {
    const providerParam = searchParams.get('provider')
    const provider =
      providerParam && isSocialProvider(providerParam)
        ? providerParam
        : providerParam
          ? (fromApiProviderCode(providerParam) ?? 'kakao')
          : 'kakao'
    const tokens = await client.completeCallback({
      provider,
      intent: 'login',
      adminSsoSessionId,
    })
    return { kind: 'authenticated', tokens }
  } catch (err) {
    if (isSocialAccountNotLinkedError(err)) {
      return { kind: 'not_linked' }
    }
    if (isSocialAccountAlreadyLinkedError(err)) {
      return { kind: 'already_linked' }
    }
    if (err instanceof Error) {
      return { kind: 'failed', message: err.message }
    }
    return { kind: 'failed', message: '소셜 로그인 처리에 실패했습니다.' }
  }
}

const ADMIN_SSO_LINK_READY_STATUSES = new Set(['READY', 'READY_TO_LINK', 'CONNECTED'])

function isAdminSsoLinkReadyStatus(status?: string | null): boolean {
  if (!status) {
    return false
  }
  return ADMIN_SSO_LINK_READY_STATUSES.has(status.trim().toUpperCase())
}

/** Admin SSO link — backend callback 후 returnUrl query 처리 (remote) */
export async function processAdminSsoLinkReturn(
  client: SocialAuthClient,
  provider: SocialProvider | null,
  searchParams: URLSearchParams,
  options: ProcessOAuthLinkCallbackOptions = {}
): Promise<OAuthLinkCallbackOutcome> {
  const { cancelled, consent, signupSocialLinkToken } = options
  const error = searchParams.get('error')

  if (error) {
    return cancelled
      ? { kind: 'cancelled' }
      : {
          kind: 'failed',
          message:
            searchParams.get('error_description') ??
            searchParams.get('message') ??
            '소셜 인증이 취소되었습니다.',
        }
  }

  const challengeUuid = searchParams.get('challengeUuid') ?? searchParams.get('mfaChallengeUuid')
  const requiresMfa = searchParams.get('requiresMfa') === 'true'
  if (challengeUuid || requiresMfa) {
    return {
      kind: 'failed',
      message:
        '소셜 계정 연결 단계에서는 MFA가 필요하지 않습니다. 백엔드 SSO link callback이 로그인 MFA 응답을 보내지 않는지 확인해 주세요.',
    }
  }

  const providerParam = searchParams.get('provider')
  const resolvedProvider: SocialProvider | null =
    provider ??
    (providerParam && isSocialProvider(providerParam)
      ? providerParam
      : providerParam
        ? fromApiProviderCode(providerParam)
        : null)

  const linkedFlag =
    searchParams.get('linked') === 'true' ||
    searchParams.get('linked') === '1' ||
    searchParams.get('status')?.toUpperCase() === 'LINKED' ||
    searchParams.get('status')?.toUpperCase() === 'CONNECTED'

  if (linkedFlag && resolvedProvider) {
    client.state.addConnectedProvider(resolvedProvider)
    return { kind: 'linked', provider: resolvedProvider, pending: false }
  }

  const adminSsoSessionId = searchParams.get('adminSsoSessionId')
  const statusParam = searchParams.get('status')
  if (adminSsoSessionId && resolvedProvider) {
    if (!consent) {
      return { kind: 'failed', message: '소셜 계정 연결 결과를 확인할 수 없습니다.' }
    }

    if (statusParam && !isAdminSsoLinkReadyStatus(statusParam)) {
      return {
        kind: 'failed',
        message: '소셜 계정 연결이 완료되지 않았습니다. 다시 시도해 주세요.',
      }
    }

    try {
      const account = await client.completeLinkSession({
        provider: resolvedProvider,
        adminSsoSessionId,
        consent,
        signupSocialLinkToken,
      })
      client.state.addConnectedProvider(resolvedProvider)
      return { kind: 'linked', provider: resolvedProvider, account, pending: false }
    } catch (err) {
      if (isSocialAccountAlreadyLinkedError(err)) {
        return { kind: 'failed', message: '이미 연결된 소셜 계정입니다.' }
      }
      if (err instanceof Error) {
        return { kind: 'failed', message: err.message }
      }
      return { kind: 'failed', message: '소셜 계정 연결을 완료하지 못했습니다.' }
    }
  }

  const code = searchParams.get('code')
  if (code && resolvedProvider) {
    return processOAuthLinkCallback(client, resolvedProvider, searchParams, options)
  }

  const normalizedStatus = statusParam?.trim().toUpperCase()
  if (
    resolvedProvider &&
    !error &&
    (normalizedStatus === 'DISCONNECTED' ||
      normalizedStatus === 'NOT_LINKED' ||
      normalizedStatus === 'UNLINKED' ||
      normalizedStatus === 'NOT_CONNECTED')
  ) {
    client.state.removeConnectedProvider(resolvedProvider)
    return {
      kind: 'failed',
      message: '소셜 계정 연결이 완료되지 않았습니다. 다시 시도해 주세요.',
    }
  }

  if (!consent) {
    return { kind: 'failed', message: '소셜 계정 연결 결과를 확인할 수 없습니다.' }
  }

  return { kind: 'failed', message: '소셜 계정 연결 결과를 확인할 수 없습니다.' }
}

/** 관리자 소셜 로그인 전용 — mock `/oauth/{provider}` + code 교환 */
export async function processOAuthCallback(
  client: SocialAuthClient,
  provider: SocialProvider,
  searchParams: URLSearchParams,
  options: ProcessOAuthCallbackOptions = {}
): Promise<OAuthCallbackOutcome> {
  const { cancelled } = options
  const error = searchParams.get('error')
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (error) {
    return cancelled ? { kind: 'cancelled' } : { kind: 'failed', message: '소셜 인증이 취소되었습니다.' }
  }

  if (!code) {
    return { kind: 'failed', message: '인가 코드가 없어 소셜 로그인을 진행할 수 없습니다.' }
  }

  if (!client.state.validateOAuthState(provider, state)) {
    return { kind: 'failed', message: 'OAuth state 검증에 실패했습니다. 다시 시도해주세요.' }
  }

  try {
    const tokens = await client.completeCallback({
      provider,
      intent: 'login',
      code,
      state: state ?? undefined,
    })
    return { kind: 'authenticated', tokens }
  } catch (err) {
    if (isSocialAccountNotLinkedError(err)) {
      return { kind: 'not_linked' }
    }
    if (isSocialAccountAlreadyLinkedError(err)) {
      return { kind: 'already_linked' }
    }
    if (err instanceof Error) {
      return { kind: 'failed', message: err.message }
    }
    return { kind: 'failed', message: '소셜 로그인 처리에 실패했습니다.' }
  }
}

export interface ProcessOAuthLinkCallbackOptions {
  cancelled?: boolean
  consent?: SocialLinkConsent
  signupSocialLinkToken?: string
}

/** 관리자 SSO 계정 연결 — `/oauth/{provider}` + intent `link` */
export async function processOAuthLinkCallback(
  client: SocialAuthClient,
  provider: SocialProvider,
  searchParams: URLSearchParams,
  options: ProcessOAuthLinkCallbackOptions = {}
): Promise<OAuthLinkCallbackOutcome> {
  const { cancelled, consent } = options
  const error = searchParams.get('error')
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const idToken = searchParams.get('id_token') ?? undefined

  if (error) {
    return cancelled ? { kind: 'cancelled' } : { kind: 'failed', message: '소셜 인증이 취소되었습니다.' }
  }

  if (!code) {
    return { kind: 'failed', message: '인가 코드가 없어 소셜 계정 연결을 진행할 수 없습니다.' }
  }

  if (!client.state.validateOAuthState(provider, state)) {
    return { kind: 'failed', message: 'OAuth state 검증에 실패했습니다. 다시 시도해주세요.' }
  }

  const defaultConsent: SocialLinkConsent = consent ?? {
    socialConsentVersion: '1.0',
    socialConsentAgreed: true,
  }

  try {
    if (!client.hasAccessToken()) {
      client.state.setPendingSocialLink({
        provider,
        code,
        state: state ?? undefined,
        consent: defaultConsent,
      })
      client.state.addConnectedProvider(provider)
      return { kind: 'linked', provider, pending: true }
    }

    const account = await client.linkAccount({
      provider,
      accessToken: code,
      idToken,
      state: state ?? undefined,
      consent: defaultConsent,
    })
    client.state.addConnectedProvider(provider)
    return { kind: 'linked', provider, account, pending: false }
  } catch (err) {
    if (isSocialAccountAlreadyLinkedError(err)) {
      return { kind: 'failed', message: '이미 연결된 소셜 계정입니다.' }
    }
    if (err instanceof Error) {
      return { kind: 'failed', message: err.message }
    }
    return { kind: 'failed', message: '소셜 계정 연결에 실패했습니다.' }
  }
}

/** @deprecated 가입 signup session API — mock 전용. 실 API는 {@link processOAuthLinkCallback} */
export async function processSignupSocialReturn(
  client: SocialAuthClient,
  searchParams: URLSearchParams,
  options: ProcessSignupSocialReturnOptions = {}
): Promise<SignupSocialReturnOutcome> {
  const { cancelled, consent } = options
  const error = searchParams.get('error')
  const sessionIdRaw = searchParams.get('socialVerificationSessionId')

  if (error) {
    return cancelled ? { kind: 'cancelled' } : { kind: 'failed', message: '소셜 인증이 취소되었습니다.' }
  }

  if (!sessionIdRaw) {
    return { kind: 'failed', message: '소셜 인증 세션 ID가 없습니다.' }
  }

  const sessionId = Number(sessionIdRaw)
  if (Number.isNaN(sessionId) || sessionId <= 0) {
    return { kind: 'failed', message: '소셜 인증 세션 ID가 올바르지 않습니다.' }
  }

  const defaultConsent: SocialLinkConsent = consent ?? {
    socialConsentVersion: '1.0',
    socialConsentAgreed: true,
  }

  try {
    const session = await client.fetchSignupSession(sessionId)
    const provider = session.provider

    if (!isSignupSessionReady(session.status)) {
      return {
        kind: 'failed',
        message: '소셜 인증 세션이 만료되었거나 유효하지 않습니다.',
      }
    }

    if (!client.hasAccessToken()) {
      client.state.setPendingSocialLink({
        provider,
        socialVerificationSessionId: session.socialVerificationSessionId,
        consent: defaultConsent,
      })
      client.state.addConnectedProvider(provider)
      return { kind: 'linked', provider, session, pending: true }
    }

    const account = await client.linkAccount({
      provider,
      socialVerificationSessionId: session.socialVerificationSessionId,
      consent: defaultConsent,
    })
    client.state.addConnectedProvider(provider)
    return { kind: 'linked', provider, session, account, pending: false }
  } catch (err) {
    if (isSocialAccountAlreadyLinkedError(err)) {
      return { kind: 'failed', message: '이미 연결된 소셜 계정입니다.' }
    }
    if (err instanceof Error) {
      return { kind: 'failed', message: err.message }
    }
    return { kind: 'failed', message: '소셜 계정 연결에 실패했습니다.' }
  }
}

export {
  SocialAccountNotLinkedError,
  SocialAccountAlreadyLinkedError,
  isSocialAccountNotLinkedError,
  isSocialAccountAlreadyLinkedError,
}
