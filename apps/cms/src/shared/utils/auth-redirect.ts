/**
 * 로그인 직후·리다이렉트 파라미터 없을 때 기본 경로. 비관리자는 `IndexPage`가 동일 경로로 다시 보냄.
 */
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
