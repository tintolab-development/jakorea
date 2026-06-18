import { IdentityVerificationApiError, parseIdentityVerificationApiError } from './errors'

export function unwrapApiData<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    throw new IdentityVerificationApiError('UNKNOWN', '본인인증 응답을 해석할 수 없습니다.')
  }
  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseIdentityVerificationApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as T
  }
  return o as T
}

export function rethrowIdentityApiError(error: unknown, fallbackMessage: string): never {
  if (error instanceof IdentityVerificationApiError) {
    throw error
  }
  const axiosErr = error as { response?: { data?: unknown } }
  if (axiosErr.response?.data) {
    throw parseIdentityVerificationApiError(axiosErr.response.data)
  }
  throw error instanceof Error ? error : new IdentityVerificationApiError('UNKNOWN', fallbackMessage)
}
