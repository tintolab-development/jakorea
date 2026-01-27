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

  switch (user.role) {
    case 'ADMIN':
      return '/' // 관리자는 관리자 홈(Dashboard)으로
    case 'INSTRUCTOR':
      return '/instructor/schedule' // 강사는 교육 일정 페이지로
    case 'INDIVIDUAL':
      return '/schedules/my' // 학생은 내 일정 페이지로
    case 'SCHOOL':
      return '/surveys' // 학교는 만족도설문 페이지로
    default:
      return '/'
  }
}
