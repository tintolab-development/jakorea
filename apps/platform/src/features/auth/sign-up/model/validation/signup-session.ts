/** 실서버 가입 POST에 필요한 본인/보호자 인증 세션이 있는지 */
export function hasRequiredVerificationSessions(input: {
  isUnderAgeSignup: boolean
  identityVerificationSessionId?: number | null
  guardianVerificationSessionId?: number | null
}): boolean {
  if (input.isUnderAgeSignup) {
    return input.guardianVerificationSessionId != null
  }
  return input.identityVerificationSessionId != null
}

export const SIGNUP_IDENTITY_REQUIRED_MESSAGE =
  '본인인증 연동 후 가입을 완료할 수 있어요. 잠시 후 다시 시도해 주세요.'
