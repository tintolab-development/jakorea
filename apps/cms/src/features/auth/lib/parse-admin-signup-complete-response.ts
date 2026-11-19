import {
  AdminRegisterApiError,
  type AdminSelfSignupResponse,
} from '@/features/auth/model/admin-register-api.types'

export interface VerifiedAdminSignupCompleteResponse {
  adminId: number
  email: string
  status: 'PENDING_VERIFICATION'
  nextStep?: string
  signupSocialLinkToken?: string
  signupSocialLinkExpiresAt?: string
}

/**
 * A successful HTTP status does not prove that a pending administrator was created.
 * Reject incomplete or inconsistent server contracts before showing the completion page.
 */
export function parseAdminSignupCompleteResponse(
  result: AdminSelfSignupResponse,
  submittedEmail: string
): VerifiedAdminSignupCompleteResponse {
  const adminId = result.adminId ?? result.adminAccountId
  const responseEmail = result.email?.trim()
  if (
    typeof adminId !== 'number' ||
    !Number.isSafeInteger(adminId) ||
    adminId <= 0 ||
    result.status !== 'PENDING_VERIFICATION' ||
    !responseEmail ||
    responseEmail.toLowerCase() !== submittedEmail.trim().toLowerCase()
  ) {
    throw new AdminRegisterApiError(
      'SIGNUP_RESPONSE_INVALID',
      '가입 완료 결과를 확인할 수 없습니다. 관리자에게 문의해 주세요.'
    )
  }
  return {
    adminId: adminId as number,
    email: responseEmail,
    status: 'PENDING_VERIFICATION',
    nextStep: result.nextStep,
    signupSocialLinkToken: result.signupSocialLinkToken,
    signupSocialLinkExpiresAt: result.signupSocialLinkExpiresAt,
  }
}
