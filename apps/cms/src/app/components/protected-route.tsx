/**
 * 보호된 라우트 컴포넌트
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 4.2.1: 권한별 경로 접근 제어
 * FSD: app 레이어로 이동 (features/auth, features/permission-request 사용, shared는 features 미참조 유지)
 */

import { Navigate, useLocation, useParams } from 'react-router-dom'
import { Spin } from 'antd'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessProgram } from '@/features/permission-request/lib/program-acl'
import { canAccessPath } from '@/shared/config/menu-config'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import type { UserRole } from '@/types/user'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading, checkAuth, requiresMfa, mfaState } = useAuthStore()
  const location = useLocation()
  const params = useParams()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('auth_token')
        const expiresAt = localStorage.getItem('auth_expires_at')

        if (token && expiresAt) {
          const expiryTime = new Date(expiresAt).getTime()
          const now = Date.now()
          const bufferTime = 30 * 1000

          if (expiryTime > now + bufferTime) {
            if (!isAuthenticated) {
              try {
                await checkAuth()
              } catch (error) {
                console.error('Auth check failed in ProtectedRoute:', error)
              }
            }
          } else {
            useAuthStore.getState().logout()
          }
        } else if (!token || !expiresAt) {
          if (isAuthenticated) {
            useAuthStore.getState().logout()
          }
        }
      }
      setIsChecking(false)
    }

    initAuth()
  }, [])

  if (isChecking || loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAuth && user?.role === 'ADMIN' && requiresMfa && !mfaState?.isVerified) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role as UserRole)
    if (!hasRequiredRole) {
      return (
        <ComingSoonPage
          title="접근 권한이 없습니다"
          description="이 페이지에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
        />
      )
    }
  }

  if (user && location.pathname !== '/' && !canAccessPath(location.pathname, user.role)) {
    return (
      <ComingSoonPage
        title="접근 권한이 없습니다"
        description="이 페이지에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
      />
    )
  }

  const programId = params.id || params.programId
  if (user && programId && location.pathname.includes('/programs/')) {
    const action = location.pathname.includes('/edit') ? 'EDIT' : 'VIEW'
    if (!canAccessProgram(user, programId, action)) {
      return (
        <ComingSoonPage
          title="접근 권한이 없습니다"
          description="이 프로그램에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
        />
      )
    }
  }

  return <>{children}</>
}
