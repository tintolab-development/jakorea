import { SocialAuthApiError } from './errors'
import type { AuthTokenResult, SocialLoginMfaChallenge } from './types'

export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data !== undefined) {
      return unwrapApiData<T>(o.data)
    }
  }
  return payload as T
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** 로그인 session consume은 JWT가 아니라 MFA challenge를 반환한다. */
export function readSocialLoginMfaChallenge(payload: unknown): SocialLoginMfaChallenge | null {
  const data = unwrapApiData<unknown>(payload)
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  // 토큰 응답이면 MFA challenge가 아니다 (QA-0137: refreshToken은 본문에 없을 수 있어 access만 본다)
  if (typeof o.accessToken === 'string' && o.accessToken.length > 0) {
    return null
  }
  const challengeUuid = readOptionalString(o.challengeUuid) ?? readOptionalString(o.mfaChallengeUuid)
  if (!challengeUuid) return null
  return {
    challengeUuid,
    mfaMethod: readOptionalString(o.mfaMethod),
    expiresAt: readOptionalString(o.expiresAt),
    mfaSetupRequired: typeof o.mfaSetupRequired === 'boolean' ? o.mfaSetupRequired : undefined,
  }
}

function messageLooksLikeAccountNotLinked(message: string): boolean {
  const normalized = message.toUpperCase()
  return (
    normalized.includes('NOT_LINKED') ||
    normalized.includes('ADMIN_SOCIAL_ACCOUNT_NOT_LINKED') ||
    message.includes('연결된 소셜 계정이 없') ||
    message.includes('소셜 계정이 연결되지')
  )
}

export function unwrapAuthTokenResult(payload: unknown): AuthTokenResult {
  const data = unwrapApiData<unknown>(payload)
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const accessToken = o.accessToken
    const refreshToken = o.refreshToken
    // QA-0137: access만 필수. refreshToken은 전환기에만 본문에 온다(쿠키 전용 운영이면 없음).
    if (typeof accessToken === 'string' && accessToken.length > 0) {
      const ageGroupRaw = typeof o.ageGroup === 'string' ? o.ageGroup.trim().toUpperCase() : ''
      const ageGroup =
        ageGroupRaw === 'UNDER_14' || ageGroupRaw === 'OVER_14' ? ageGroupRaw : undefined
      return {
        accessToken,
        refreshToken:
          typeof refreshToken === 'string' && refreshToken.length > 0 ? refreshToken : undefined,
        tokenType: typeof o.tokenType === 'string' ? o.tokenType : undefined,
        expiresInSeconds:
          typeof o.expiresInSeconds === 'number' ? o.expiresInSeconds : undefined,
        ageGroup,
      }
    }
  }
  throw new SocialAuthApiError('INVALID_RESPONSE', '인증 토큰 응답 형식이 올바르지 않습니다.')
}

export function rethrowSocialAuthApiError(err: unknown, fallback: string): never {
  if (err instanceof SocialAuthApiError) {
    throw err
  }
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: unknown; status?: number } }
    const status = axiosErr.response?.status
    const apiError = SocialAuthApiErrorFromStatus(status, axiosErr.response?.data, fallback)
    throw apiError
  }
  throw new SocialAuthApiError('NETWORK', fallback)
}

function SocialAuthApiErrorFromStatus(
  status: number | undefined,
  data: unknown,
  fallback: string
): SocialAuthApiError {
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const message =
      wrapped?.message ??
      (typeof o.message === 'string' ? o.message : undefined) ??
      fallback
    const explicitCode = wrapped?.code ?? (typeof o.code === 'string' ? o.code : undefined)
    if (explicitCode) {
      return new SocialAuthApiError(String(explicitCode), message)
    }
    if (status === 404) {
      return new SocialAuthApiError(
        messageLooksLikeAccountNotLinked(message) ? 'SOCIAL_ACCOUNT_NOT_LINKED' : 'NOT_FOUND',
        message
      )
    }
    if (status === 409) {
      return new SocialAuthApiError('SOCIAL_ACCOUNT_ALREADY_LINKED', message)
    }
    return new SocialAuthApiError('UNKNOWN', message)
  }
  if (status === 404) {
    return new SocialAuthApiError('NOT_FOUND', fallback)
  }
  if (status === 409) {
    return new SocialAuthApiError('SOCIAL_ACCOUNT_ALREADY_LINKED', fallback)
  }
  return new SocialAuthApiError('UNKNOWN', fallback)
}
