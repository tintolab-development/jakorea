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

export function resolveIdentitySelfSignupCompletedAfterAdminRegistration(
  source: MemberRegistrationFlagSource
): boolean {
  if (source.identitySelfSignupCompletedAfterAdminRegistration === true) return true
  if (resolveRegisteredByAdmin(source)) return false
  return source.identityVerified === true
}
