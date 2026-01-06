/**
 * 권한 접근 가능 여부 확인 훅
 * Phase 4.1.3: 권한 검증 시스템
 */

import { useMemo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { hasRole, hasAnyRole, hasAllRoles } from '@/shared/utils/permissions'
import { canAccessPath } from '@/shared/config/menu-config'
import type { UserRole } from '@/types/user'

/**
 * 특정 권한 접근 가능 여부 확인
 * @param requiredRole 필요한 권한
 * @returns 접근 가능 여부
 */
export function useCanAccess(requiredRole: UserRole): boolean {
  const { user } = useAuthStore()

  return useMemo(() => {
    return hasRole(user, requiredRole)
  }, [user, requiredRole])
}

/**
 * 여러 권한 중 하나라도 접근 가능한지 확인
 * @param requiredRoles 필요한 권한 배열
 * @returns 접근 가능 여부
 */
export function useCanAccessAny(requiredRoles: UserRole[]): boolean {
  const { user } = useAuthStore()

  return useMemo(() => {
    return hasAnyRole(user, requiredRoles)
  }, [user, requiredRoles])
}

/**
 * 모든 권한을 가지고 있는지 확인
 * @param requiredRoles 필요한 권한 배열
 * @returns 접근 가능 여부
 */
export function useCanAccessAll(requiredRoles: UserRole[]): boolean {
  const { user } = useAuthStore()

  return useMemo(() => {
    return hasAllRoles(user, requiredRoles)
  }, [user, requiredRoles])
}

/**
 * 특정 경로에 접근 가능한지 확인
 * @param path 확인할 경로
 * @returns 접근 가능 여부
 */
export function useCanAccessPath(path: string): boolean {
  const { user } = useAuthStore()

  return useMemo(() => {
    return canAccessPath(path, user?.role || null)
  }, [path, user?.role])
}

/**
 * 권한이 필요할 때 에러를 발생시키는 훅
 * 권한이 없으면 에러를 throw
 * @param requiredRole 필요한 권한
 * @throws 권한이 없을 경우 에러
 */
export function useRequirePermission(requiredRole: UserRole): void {
  const { user } = useAuthStore()

  if (!hasRole(user, requiredRole)) {
    throw new Error(`이 작업을 수행하려면 ${requiredRole} 권한이 필요합니다.`)
  }
}

