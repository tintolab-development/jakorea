import {
  AdminRegisterApiError,
  type AdminSelfSignupResponse,
} from '@/features/auth/model/admin-register-api.types'

/**
 * A 2xx response is not proof of a completed signup unless the API contract
 * contains the newly created pending account. Never show the success page for
 * a malformed result.
 */
export function validateAdminSignupCompletion(
  result: AdminSelfSignupResponse,
  expectedEmail: string
): number {
  const accountId = result.adminId ?? result.adminAccountId
  if (
    typeof accountId !== 'number' ||
    !Number.isSafeInteger(accountId) ||
    accountId <= 0 ||
    result.status !== 'PENDING_VERIFICATION' ||
    result.loginEnabled !== false ||
    result.nextStep !== 'MASTER_ADMIN_APPROVAL_REQUIRED' ||
    typeof result.email !== 'string' ||
    result.email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()
  ) {
    throw new AdminRegisterApiError(
      'ADMIN_SIGNUP_INVALID_RESPONSE',
      '회원가입 완료 결과를 확인하지 못했습니다. 관리자에게 문의해 주세요.'
    )
  }
  return accountId
}
