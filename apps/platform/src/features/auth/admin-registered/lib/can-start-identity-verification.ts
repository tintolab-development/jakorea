type CanStartAdminProvisionedIdentityVerificationInput = {
  isConfirming: boolean
  isRemote: boolean
  hasBirthAndGender: boolean
}

/**
 * 관리자 등록 IDENTITY 단계 — NICE 시작 가능 여부.
 *
 * 로그인 직후 wizard는 이메일만 있고 생년월일·성별이 비어 있다.
 * Remote는 PROFILE이 서버에 이미 있으므로 로컬 값 없이도 본인인증을 시작한다.
 */
export function canStartAdminProvisionedIdentityVerification(
  input: CanStartAdminProvisionedIdentityVerificationInput,
): boolean {
  if (input.isConfirming) return false
  if (input.isRemote) return true
  return input.hasBirthAndGender
}
