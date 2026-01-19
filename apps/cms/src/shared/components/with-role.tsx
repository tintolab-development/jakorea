/**
 * 권한 검증 HOC (Higher Order Component)
 * Phase 4.1.3: 권한 검증 시스템
 */

import { useEffect } from 'react'
import type { ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { hasRole, hasAnyRole } from '@/shared/utils/permissions'
import type { UserRole } from '@/types/user'

interface WithRoleOptions {
  redirectTo?: string
}

/**
 * 특정 권한이 필요한 HOC
 * @param Component 래핑할 컴포넌트
 * @param requiredRole 필요한 권한
 * @param options 옵션
 * @returns 권한이 있는 경우에만 렌더링되는 컴포넌트
 */
export function withRole<P extends object>(
  Component: ComponentType<P>,
  requiredRole: UserRole,
  options: WithRoleOptions = {}
) {
  const { redirectTo = '/forbidden' } = options

  return function WithRoleComponent(props: P) {
    const { user } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
      if (!hasRole(user, requiredRole)) {
        navigate(redirectTo, { replace: true })
      }
    }, [user, navigate])

    if (!hasRole(user, requiredRole)) {
      return null
    }

    return <Component {...props} />
  }
}

/**
 * 여러 권한 중 하나라도 필요한 HOC
 * @param Component 래핑할 컴포넌트
 * @param requiredRoles 필요한 권한 배열
 * @param options 옵션
 * @returns 권한이 있는 경우에만 렌더링되는 컴포넌트
 */
export function withAnyRole<P extends object>(
  Component: ComponentType<P>,
  requiredRoles: UserRole[],
  options: WithRoleOptions = {}
) {
  const { redirectTo = '/forbidden' } = options

  return function WithAnyRoleComponent(props: P) {
    const { user } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
      if (!hasAnyRole(user, requiredRoles)) {
        navigate(redirectTo, { replace: true })
      }
    }, [user, navigate])

    if (!hasAnyRole(user, requiredRoles)) {
      return null
    }

    return <Component {...props} />
  }
}

