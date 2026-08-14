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

export function isAdminLoginApprovalPendingError(error: unknown): boolean {
  if (error instanceof AdminLoginApprovalPendingError) {
    return true
  }

  if (error && typeof error === 'object' && 'name' in error && error.name === 'AdminLoginApiError') {
    const apiError = error as { code?: string }
    if (apiError.code && isAdminLoginApprovalPendingCode(apiError.code)) {
      return true
    }
  }

  return false
}
