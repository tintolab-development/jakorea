/** 실서버 가입 POST에 필요한 본인/보호자 인증 세션이 있는지 */
export function hasRequiredVerificationSessions(input: {
  isUnderAgeSignup: boolean
  identityVerificationSessionId?: number | null
  guardianVerificationSessionId?: number | null
  signupIntentId?: string | null
  guardianBridgeFinalConsentCompleted?: boolean
}): boolean {
  if (input.isUnderAgeSignup) {
    return (
      input.guardianVerificationSessionId != null &&
      Boolean(input.signupIntentId?.trim()) &&
      input.guardianBridgeFinalConsentCompleted === true
    )
  }
  return input.identityVerificationSessionId != null
}

export const SIGNUP_IDENTITY_REQUIRED_MESSAGE =
  '본인인증 연동 후 가입을 완료할 수 있어요. 잠시 후 다시 시도해 주세요.'

/** 미성년 가입 완료 — React state와 보호자 브릿지 저장값을 맞춰 검사 */
export function resolveUnderAgeSignupSessions(input: {
  signupIntentId?: string | null
  guardianVerificationSessionId?: number | null
  guardianBridgeFinalConsentCompleted?: boolean
  persisted?: {
    signupIntentId?: string
    guardianSessionId?: number
    finalConsentCompleted?: boolean
  } | null
  wizardStep?: number
}): {
  signupIntentId: string | null
  guardianVerificationSessionId: number | null
  guardianBridgeFinalConsentCompleted: boolean
} {
  const signupIntentId =
    input.signupIntentId?.trim() || input.persisted?.signupIntentId?.trim() || null
  const guardianVerificationSessionId =
    input.guardianVerificationSessionId ?? input.persisted?.guardianSessionId ?? null
  const guardianBridgeFinalConsentCompleted =
    input.guardianBridgeFinalConsentCompleted === true ||
    input.persisted?.finalConsentCompleted === true ||
    (typeof input.wizardStep === 'number' && input.wizardStep >= 4)

  return {
    signupIntentId,
    guardianVerificationSessionId,
    guardianBridgeFinalConsentCompleted,
  }
}
