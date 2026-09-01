import { isAxiosError } from 'axios'

/** 로그인 423·승인 대기 계정 — 사용자 노출 문구 */
export const ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE =
  '관리자에 의해 승인이 필요한 계정입니다. 승인 완료 후 로그인할 수 있습니다.'

export class AdminLoginApprovalPendingError extends Error {
  constructor(message = ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE) {
    super(message)
    this.name = 'AdminLoginApprovalPendingError'
  }
}

const ADMIN_LOGIN_APPROVAL_PENDING_CODES = new Set([
  'PENDING_VERIFICATION',
  'APPROVAL_REQUIRED',
  'ADMIN_APPROVAL_PENDING',
  'ACCOUNT_INACTIVE',
])

export function isAdminLoginApprovalPendingCode(code: string): boolean {
  const upper = code.toUpperCase()
  return ADMIN_LOGIN_APPROVAL_PENDING_CODES.has(upper)
}

export function extractAdminLoginErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const body = payload as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim()
  return undefined
}

export function isAdminLoginApprovalPendingResponse(
  payload: unknown,
  httpStatus?: number
): boolean {
  if (httpStatus === 423) return true
  const code = extractAdminLoginErrorCode(payload)
  return Boolean(code && isAdminLoginApprovalPendingCode(code))
}

export function isAdminLoginApprovalPendingError(error: unknown): boolean {
  if (error instanceof AdminLoginApprovalPendingError) {
    return true
  }

  if (isAxiosError(error)) {
    return isAdminLoginApprovalPendingResponse(error.response?.data, error.response?.status)
  }

  if (error && typeof error === 'object' && 'name' in error && error.name === 'AdminLoginApiError') {
    const apiError = error as { code?: string }
    if (apiError.code && isAdminLoginApprovalPendingCode(apiError.code)) {
      return true
    }
  }

  return false
}
