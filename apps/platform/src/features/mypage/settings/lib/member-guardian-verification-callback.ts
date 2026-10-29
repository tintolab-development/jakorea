/** NICE 프론트 복귀. start body `frontendReturnUrl` allowlist origin + 이 path. */
export const MEMBER_GUARDIAN_VERIFICATION_CALLBACK_PATH =
  '/mypage/settings/guardian-identity/callback'

export const MEMBER_GUARDIAN_VERIFICATION_COMPLETION_PREFIX =
  'platform_member_guardian_verification'

export function buildMemberGuardianVerificationFrontendReturnUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const origin = window.location.origin?.trim()
  if (!origin) return undefined
  return `${origin}${MEMBER_GUARDIAN_VERIFICATION_CALLBACK_PATH}`
}
