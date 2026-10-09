import { IdentityVerificationApiError } from '@jakorea/identity-verification'
import { isAxiosError } from 'axios'

const DEFAULT_IDENTITY_ERROR_MESSAGE = '본인인증에 실패했어요. 다시 시도해 주세요.'

/** BE가 본인인증 실패에도 로그인용 INVALID_CREDENTIALS 문구를 내리는 경우 */
const LOGIN_CREDENTIALS_COPY = '이메일 또는 비밀번호'

const IDENTITY_START_CODES = new Set([
  'INVALID_CREDENTIALS',
  'UNAUTHORIZED',
  'SECURITY_COMPONENT_NOT_CONFIGURED',
  'IDENTITY_PROVIDER_UNAVAILABLE',
  'IDENTITY_START_FAILED',
])

function extractCode(error: unknown): string | undefined {
  if (error instanceof IdentityVerificationApiError) {
    return error.code
  }
  if (!isAxiosError(error)) return undefined
  const data = error.response?.data
  if (!data || typeof data !== 'object') return undefined
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim()
  return undefined
}

function extractMessage(error: unknown): string | undefined {
  if (error instanceof IdentityVerificationApiError && error.message.trim()) {
    return error.message.trim()
  }
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const body = data as { message?: unknown; error?: { message?: unknown } }
      const nested = body.error?.message
      if (typeof nested === 'string' && nested.trim()) return nested.trim()
      if (typeof body.message === 'string' && body.message.trim()) return body.message.trim()
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return undefined
}

/**
 * 본인인증 API 실패 메시지.
 * BE가 NICE start 실패를 INVALID_CREDENTIALS + 로그인 카피로 내려도 본인인증 문구로 치환한다.
 */
export function getIdentityApiErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_IDENTITY_ERROR_MESSAGE,
): string {
  const code = extractCode(error)?.toUpperCase()
  const message = extractMessage(error)

  if (code && IDENTITY_START_CODES.has(code)) {
    if (message && !message.includes(LOGIN_CREDENTIALS_COPY)) {
      // 본인인증 맥락의 전용 메시지(allowlist 등)는 유지
      if (code !== 'INVALID_CREDENTIALS') return message
    }
    return fallback
  }

  if (message?.includes(LOGIN_CREDENTIALS_COPY)) {
    return fallback
  }

  return message?.trim() || fallback
}
