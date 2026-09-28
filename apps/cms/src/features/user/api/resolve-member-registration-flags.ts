/**
 * members / admin-accounts / account-directory API 응답 → CMS `registeredByAdmin` 정규화.
 * 가입 유형 SoT는 `createdByAdmin`·`registeredByAdmin`(동치). role·adminAccountId로 추론하지 않는다.
 */

export type MemberRegistrationFlagSource = {
  role?: string
  registeredByAdmin?: boolean
  preRegistered?: boolean
  createdByAdmin?: boolean
  adminAccountId?: number | null
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
  identityVerified?: boolean
}

/** `createdByAdmin === true` (또는 동치 호환 필드)일 때만 관리자 등록. 없으면 false. */
export function resolveRegisteredByAdmin(source: MemberRegistrationFlagSource): boolean {
  if (source.registeredByAdmin === true) return true
  if (source.createdByAdmin === true) return true
  if (source.preRegistered === true) return true
  return false
}

/**
 * 어드민 등록 후 본인 최초로그인·본인인증(및 비밀번호 변경) 완료 여부.
 * - 명시 플래그가 true면 완료
 * - 그 외(어드민 등록 포함)는 `identityVerified === true`를 완료로 간주
 */
export function resolveIdentitySelfSignupCompletedAfterAdminRegistration(
  source: MemberRegistrationFlagSource
): boolean {
  if (source.identitySelfSignupCompletedAfterAdminRegistration === true) return true
  return source.identityVerified === true
}
