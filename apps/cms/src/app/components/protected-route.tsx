/**
 * 보호된 라우트 컴포넌트
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 4.2.1: 권한별 경로 접근 제어
 * FSD: app 레이어로 이동 (features/auth, features/permission-request 사용, shared는 features 미참조 유지)
 *
 * auth-store가 localStorage에서 동기 복원한 세션을 즉시 신뢰하고,
 * 백그라운드 토큰 검증은 AuthProvider에 위임한다.
 */

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
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
  const { isAuthenticated, user, requiresMfa, mfaState } = useAuthStore()

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

  // 경로/프로그램 접근 제어는 레이아웃 콘텐츠 영역에서 처리 (LNB·헤더 유지)
  return <>{children}</>
}
