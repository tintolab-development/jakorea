import type { SocialAuthClient } from './client'
import {
  isSocialAccountAlreadyLinkedError,
  isSocialAccountNotLinkedError,
  SocialAccountAlreadyLinkedError,
  SocialAccountNotLinkedError,
} from './errors'
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

/** 관리자 소셜 로그인 전용 — `/oauth/{provider}` + Admin SSO callback */
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
      code,
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
