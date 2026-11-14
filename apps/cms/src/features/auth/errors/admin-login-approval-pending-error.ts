import { isAxiosError } from 'axios'
import { isAdminLoginAccountLockedResponse } from './admin-login-account-locked-error'

/** 로그인 423 ACCOUNT_PENDING_APPROVAL(승인 대기 계정) — 사용자 노출 문구 (백엔드 영문 메시지 대신 고정) */
export const ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE =
  '현재 관리자 승인 대기 중입니다. 승인 완료 후 로그인 및 서비스 이용이 가능합니다.'

export class AdminLoginApprovalPendingError extends Error {
  constructor(message = ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE) {
    super(message)
    this.name = 'AdminLoginApprovalPendingError'
  }
}

/**
 * 승인 대기 코드. 잠금(ACCOUNT_LOCKED)·사용 불가(ACCOUNT_INACTIVE)·로그인 비활성(LOGIN_DISABLED)도
 * 같은 HTTP 423 으로 오므로 코드로만 구분한다.
 */
const ADMIN_LOGIN_APPROVAL_PENDING_CODES = new Set([
  /** 셀프 가입 후 MASTER 승인 대기 — POST /api/admin/auth/login 423 */
  'ACCOUNT_PENDING_APPROVAL',
  'PENDING_VERIFICATION',
  'APPROVAL_REQUIRED',
  'ADMIN_APPROVAL_PENDING',
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

/**
 * `error.code` 가 승인 대기 코드일 때만 승인 대기로 본다.
 * HTTP 423 은 잠금·사용 불가 계정에도 쓰이므로 상태 코드만으로는 판단하지 않는다.
 * (`_httpStatus` 는 기존 호출부 시그니처 유지용)
 */
export function isAdminLoginApprovalPendingResponse(
  payload: unknown,
  _httpStatus?: number
): boolean {
  // 계정 잠금도 423 으로 온다 — 잠금이면 승인 대기로 보지 않는다
  if (isAdminLoginAccountLockedResponse(payload)) return false
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
