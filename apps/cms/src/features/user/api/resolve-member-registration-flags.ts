/**
 * members / admin-accounts API 응답 → CMS `registeredByAdmin`·`identitySelfSignupCompletedAfterAdminRegistration` 정규화.
 * admin-accounts로 생성된 관리자는 members API에 preRegistered가 없을 수 있음(adminAccountId로 보완).
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

export function resolveRegisteredByAdmin(source: MemberRegistrationFlagSource): boolean {
  if (source.registeredByAdmin === true) return true
  if (source.preRegistered === true) return true
  if (source.createdByAdmin === true) return true
  const role = source.role?.trim().toUpperCase()
  const adminAccountId = source.adminAccountId
  if (role === 'ADMIN' && adminAccountId != null && adminAccountId > 0) return true
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
