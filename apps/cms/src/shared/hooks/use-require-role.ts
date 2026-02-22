/**
 * 권한별 접근 제어 훅
 * Phase 4.1.2: 권한 체계 정의
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/lib/auth/auth-context'
import { hasRole, hasAnyRole } from '@/shared/utils/permissions'
import type { UserRole } from '@/types/user'

/**
 * 특정 권한이 필요한 훅
 * 권한이 없으면 403 페이지로 리다이렉트
 * @param requiredRole 필요한 권한
 * @param redirectTo 리다이렉트할 경로 (기본값: '/forbidden')
 */
export function useRequireRole(requiredRole: UserRole, redirectTo: string = '/forbidden') {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasRole(user, requiredRole)) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, requiredRole, redirectTo, navigate])

  return hasRole(user, requiredRole)
}

/**
 * 여러 권한 중 하나라도 필요한 훅
 * 권한이 없으면 403 페이지로 리다이렉트
 * @param requiredRoles 필요한 권한 배열
 * @param redirectTo 리다이렉트할 경로 (기본값: '/forbidden')
 */
export function useRequireAnyRole(requiredRoles: UserRole[], redirectTo: string = '/forbidden') {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasAnyRole(user, requiredRoles)) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, requiredRoles, redirectTo, navigate])

  return hasAnyRole(user, requiredRoles)
}
