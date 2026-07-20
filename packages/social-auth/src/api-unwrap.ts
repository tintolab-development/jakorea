import { SocialAuthApiError } from './errors'
import type { AuthTokenResult } from './types'

export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data !== undefined) {
      return unwrapApiData<T>(o.data)
    }
  }
  return payload as T
}

export function unwrapAuthTokenResult(payload: unknown): AuthTokenResult {
  const data = unwrapApiData<unknown>(payload)
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const accessToken = o.accessToken
    const refreshToken = o.refreshToken
    if (typeof accessToken === 'string' && typeof refreshToken === 'string') {
      return {
        accessToken,
        refreshToken,
        tokenType: typeof o.tokenType === 'string' ? o.tokenType : undefined,
        expiresInSeconds:
          typeof o.expiresInSeconds === 'number' ? o.expiresInSeconds : undefined,
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
    const code =
      wrapped?.code ??
      (typeof o.code === 'string' ? o.code : status === 404 ? 'SOCIAL_ACCOUNT_NOT_LINKED' : 'UNKNOWN')
    const message =
      wrapped?.message ??
      (typeof o.message === 'string' ? o.message : undefined) ??
      fallback
    return new SocialAuthApiError(String(code), message)
  }
  if (status === 404) {
    return new SocialAuthApiError('SOCIAL_ACCOUNT_NOT_LINKED', fallback)
  }
  if (status === 409) {
    return new SocialAuthApiError('SOCIAL_ACCOUNT_ALREADY_LINKED', fallback)
  }
  return new SocialAuthApiError('UNKNOWN', fallback)
}
