/**
 * 인증 후 리다이렉트 유틸리티
 * Phase 0.1.3: 로그인 흐름 개선
 */

import type { User } from '@/types/user'

/**
 * 사용자 역할에 따른 리다이렉트 경로 반환
 */
export function getRedirectPathByRole(user: Omit<User, 'password'> | null): string {
  if (!user) {
    return '/login'
  }

  // Phase 0.1.3: 역할별 리다이렉트
  switch (user.role) {
    case 'ADMIN':
      return '/admin'
    case 'INSTRUCTOR':
      return '/instructor'
    case 'SCHOOL':
      return '/school'
    case 'INDIVIDUAL':
    case 'STUDENT': // 하위 호환성
      return '/my'
    case 'VOLUNTEER': // 하위 호환성
      return '/my'
    default:
      return '/'
  }
}
