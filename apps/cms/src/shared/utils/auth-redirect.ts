/**
 * 로그인 직후·리다이렉트 파라미터 없을 때 기본 경로. 비관리자는 `IndexPage`가 동일 경로로 다시 보냄.
 */
import { canAccessPath } from '@/shared/config/menu-config'
import { sanitizeLoginRedirectPath } from '@/shared/utils/post-auth-redirect'
import type { User } from '@/types/user'

export function getRedirectPathByRole(user: Omit<User, 'password'> | null): string {
  if (!user) {
    return '/login'
  }

  switch (user.role) {
    case 'ADMIN':
      return '/'
    case 'INSTRUCTOR':
      return '/instructor/schedule'
    case 'INDIVIDUAL':
      return '/schedules/my'
    case 'SCHOOL':
      return '/school/my-learning'
    default:
      return '/'
  }
}

/**
 * 로그인 성공 후 최종 이동 경로.
 * `redirect`가 안전하고 해당 역할로 접근 가능한 경로면 그대로, 아니면 역할별 기본 경로.
 */
export function resolveLoginRedirectTarget(
  redirect: string | null | undefined,
  user: Omit<User, 'password'> | null
): string {
  const fallback = getRedirectPathByRole(user)
  const safe = sanitizeLoginRedirectPath(redirect)
  if (!safe || !user) return fallback
  const pathname = safe.split(/[?#]/)[0] ?? ''
  const actor = { role: user.role, adminLevel: user.adminLevel, roleCode: user.roleCode }
  return canAccessPath(pathname, actor) ? safe : fallback
}
