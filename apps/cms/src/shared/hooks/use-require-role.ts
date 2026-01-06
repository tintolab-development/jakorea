/**
 * 권한별 접근 제어 훅
 * Phase 4.1.2: 권한 체계 정의
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { hasRole, hasAnyRole } from '@/shared/utils/permissions'
import type { UserRole } from '@/types/user'

/**
 * 특정 권한이 필요한 훅
 * 권한이 없으면 로그인 페이지로 리다이렉트
 * @param requiredRole 필요한 권한
 * @returns 권한 보유 여부
 */
export function useRequireRole(requiredRole: UserRole): boolean {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const hasRequiredRole = hasRole(user, requiredRole)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!hasRequiredRole) {
      navigate('/forbidden')
    }
  }, [isAuthenticated, hasRequiredRole, navigate])

  return hasRequiredRole
}

/**
 * 여러 권한 중 하나라도 필요한 훅
 * 권한이 없으면 로그인 페이지 또는 403 페이지로 리다이렉트
 * @param requiredRoles 필요한 권한 배열
 * @returns 권한 보유 여부
 */
export function useRequireAnyRole(requiredRoles: UserRole[]): boolean {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const hasRequiredRole = hasAnyRole(user, requiredRoles)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!hasRequiredRole) {
      navigate('/forbidden')
    }
  }, [isAuthenticated, hasRequiredRole, navigate, requiredRoles])

  return hasRequiredRole
}

/**
 * 특정 권한 접근 가능 여부를 확인하는 훅
 * 리다이렉트 없이 권한 여부만 반환
 * @param requiredRole 필요한 권한
 * @returns 권한 보유 여부
 */
export function useCanAccess(requiredRole: UserRole): boolean {
  const { user } = useAuthStore()
  return hasRole(user, requiredRole)
}

/**
 * 여러 권한 중 하나라도 접근 가능한지 확인하는 훅
 * 리다이렉트 없이 권한 여부만 반환
 * @param requiredRoles 필요한 권한 배열
 * @returns 권한 보유 여부
 */
export function useCanAccessAny(requiredRoles: UserRole[]): boolean {
  const { user } = useAuthStore()
  return hasAnyRole(user, requiredRoles)
}

/**
 * 권한이 필요할 때 에러를 발생시키는 훅
 * 권한이 없으면 에러를 throw
 * @param requiredRole 필요한 권한
 * @throws 권한이 없을 경우 에러
 */
export function useRequirePermission(requiredRole: UserRole): void {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      throw new Error('인증이 필요합니다.')
    }

    if (!hasRole(user, requiredRole)) {
      throw new Error(`권한이 없습니다. 필요한 권한: ${requiredRole}`)
    }
  }, [isAuthenticated, user, requiredRole])
}



