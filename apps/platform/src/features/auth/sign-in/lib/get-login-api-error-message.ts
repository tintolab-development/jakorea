import { isAxiosError } from 'axios'

/** 로그인 423·승인 대기 계정 — 백엔드 영문 메시지 대신 고정 */
export const LOGIN_APPROVAL_PENDING_MESSAGE =
  '관리자에 의해 승인이 필요한 계정입니다. 승인 완료 후 로그인할 수 있습니다.'

const LOGIN_APPROVAL_PENDING_CODES = new Set([
  'PENDING_VERIFICATION',
  'APPROVAL_REQUIRED',
  'ADMIN_APPROVAL_PENDING',
  'ACCOUNT_INACTIVE',
])

function extractErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim()
  return undefined
}

export function isLoginApprovalPendingApiError(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  if (error.response?.status === 423) return true
  const code = extractErrorCode(error.response?.data)
  return Boolean(code && LOGIN_APPROVAL_PENDING_CODES.has(code.toUpperCase()))
}

export function getLoginApiErrorMessage(error: unknown, fallback: string): string {
  if (isLoginApprovalPendingApiError(error)) {
    return LOGIN_APPROVAL_PENDING_MESSAGE
  }

  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const body = data as {
        message?: unknown
        error?: { message?: unknown; code?: unknown }
      }
      const nested = body.error?.message
      if (typeof nested === 'string' && nested.trim()) {
        return nested.trim()
      }
      const message = body.message
      if (typeof message === 'string' && message.trim()) {
        return message.trim()
      }
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim()
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}
