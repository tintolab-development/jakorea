/**
 * 보호된 라우트 컴포넌트
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 4.2.1: 권한별 경로 접근 제어
 */

import { Navigate, useLocation, useParams } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useEffect, useState } from 'react'
import { canAccessPath } from '@/shared/config/menu-config'
import { canAccessProgram } from '@/shared/utils/program-acl'
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
    // 초기 마운트 시 인증 상태 확인
    const initAuth = async () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('auth_token')
        const expiresAt = localStorage.getItem('auth_expires_at')

        // 토큰이 있고 만료되지 않았으면 인증 상태 확인
        if (token && expiresAt) {
          const expiryTime = new Date(expiresAt).getTime()
          const now = Date.now()

          if (expiryTime > now) {
            // 만료되지 않았으면 checkAuth 호출
            if (!isAuthenticated) {
              await checkAuth()
            }
          } else {
            // 만료되었으면 로그아웃
            useAuthStore.getState().logout()
          }
        }
      }
      setIsChecking(false)
    }

    initAuth()
  }, [checkAuth, isAuthenticated]) // 초기 마운트 시에만 실행

  // 로딩 중이면 스피너 표시
  if (isChecking || loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spin size="large" />
      </div>
    )
  }

  // 인증이 필요한 경우
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Phase 0.5.1: 관리자는 MFA 인증 완료 필요
  // 모달로 처리하므로 리다이렉트는 하지 않음 (로그인 페이지에서 모달로 처리)
  // 단, 이미 로그인된 상태에서 MFA 미완료 시에는 로그인 페이지로 리다이렉트
  if (requireAuth && user?.role === 'ADMIN' && requiresMfa && !mfaState?.isVerified) {
    // 로그인 페이지에서 모달이 열리도록 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />
  }

  // 권한이 필요한 경우
  if (requiredRoles && requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role)
    if (!hasRequiredRole) {
      return <Navigate to="/forbidden" replace />
    }
  }

  // 메뉴 설정 기반 경로 접근 제어
  // IndexPage('/')는 예외 처리 - IndexPage에서 역할별로 리다이렉트 처리
  if (user && location.pathname !== '/' && !canAccessPath(location.pathname, user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  // Phase 0.1.5: 프로그램 단위 ACL 체크
  // URL에서 프로그램 ID 추출 (예: /programs/:id, /programs/:id/edit 등)
  const programId = params.id || params.programId
  if (user && programId && location.pathname.includes('/programs/')) {
    // 프로그램 관련 경로인 경우 ACL 체크
    const action = location.pathname.includes('/edit') ? 'EDIT' : 'VIEW'
    if (!canAccessProgram(user, programId, action)) {
      return <Navigate to="/forbidden" replace />
    }
  }

  // Phase 0.1.5: 관리자 레벨별 접근 제어
  if (user?.role === 'ADMIN') {
    // MASTER 관리자는 모든 경로 접근 가능
    if (user.adminLevel === 'MASTER') {
      // 접근 허용
    }
    // ADMIN 레벨은 일반 관리자 권한
    else if (user.adminLevel === 'ADMIN') {
      // 일반 관리자 권한 (프로그램 ACL로 제어됨)
    }
    // GENERAL 레벨은 제한된 권한
    else if (user.adminLevel === 'GENERAL') {
      // 일반 관리자보다 더 제한된 권한 (필요시 추가 체크)
    }
  }

  return <>{children}</>
}
