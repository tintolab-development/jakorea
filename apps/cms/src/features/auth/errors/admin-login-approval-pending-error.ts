export class AdminLoginApprovalPendingError extends Error {
  constructor(message = '현재 관리자 승인 대기 중입니다. 승인 완료 후 로그인 및 서비스 이용이 가능합니다.') {
    super(message)
    this.name = 'AdminLoginApprovalPendingError'
  }
}

const ADMIN_LOGIN_APPROVAL_PENDING_CODES = new Set([
  'PENDING_VERIFICATION',
  'APPROVAL_REQUIRED',
  'ADMIN_APPROVAL_PENDING',
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
