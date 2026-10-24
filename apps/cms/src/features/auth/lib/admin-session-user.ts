import type { User } from '@/types/user'
import { withSessionAdminRole } from '@/shared/lib/admin-role-policy'
import { parseAdminRoleCodeFromAccessToken } from '@/features/auth/lib/parse-admin-access-token-role'

export function isPlaceholderAdminSessionUser(
  user: Pick<User, 'id'> | null | undefined,
): boolean {
  const id = user?.id?.trim()
  if (!id) return true
  return (
    id.startsWith('pending-admin-') ||
    id === 'social-sso-mfa-pending' ||
    id === 'social-sso-pending'
  )
}

export function applyAccessTokenRoleToSessionUser(
  user: Omit<User, 'password'>,
  accessToken: string,
): Omit<User, 'password'> {
  const roleCode = parseAdminRoleCodeFromAccessToken(accessToken)
  if (!roleCode) return withSessionAdminRole(user)
  return withSessionAdminRole({ ...user, roleCode })
}
