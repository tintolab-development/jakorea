/**
 * 보호된 라우트 컴포넌트
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 4.2.1: 권한별 경로 접근 제어
 * FSD: app 레이어로 이동 (features/auth, features/permission-request 사용, shared는 features 미참조 유지)
 *
 * auth-store가 localStorage에서 동기 복원한 세션을 즉시 신뢰하고,
 * 백그라운드 토큰 검증은 AuthProvider에 위임한다.
 */

import { Spin } from 'antd'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ReloadRestoreFailureModal } from '@/features/auth/ui/reload-restore-failure-modal'
import { hasPasswordChangeRequiredComplete } from '@/features/auth/password-change-required/wizard-state'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import {
  PASSWORD_CHANGE_REQUIRED_PATH,
  buildLoginPathWithRedirect,
  isLoginReturnPathSuppressed,
  passwordChangeRequiredPaths,
} from '@/shared/utils/post-auth-redirect'
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
  const location = useLocation()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const user = useAuthStore(state => state.user)
  const requiresMfa = useAuthStore(state => state.requiresMfa)
  const mfaState = useAuthStore(state => state.mfaState)
  const passwordChangeRequired = useAuthStore(state => state.passwordChangeRequired)
  const isBootstrapping = useAuthStore(state => state.isBootstrapping)

  if (hasPasswordChangeRequiredComplete()) {
    return <Navigate to={passwordChangeRequiredPaths.complete} replace />
  }

  // 새로고침 뒤 access token을 refresh로 다시 받기 전에는 보호 화면을 그리지 않는다 (메인 → 로그인 깜빡임 방지).
  // 네트워크·서버 오류로 확인하지 못하면 이 로딩 화면 위에 닫기·다시 시도 안내를 띄운다.
  if (requireAuth && isBootstrapping) {
    return (
      <div
        role="status"
        aria-label="로그인 정보 확인 중"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
        <ReloadRestoreFailureModal />
      </div>
    )
  }

  // 비로그인으로 보호 화면을 연 경우(직접 URL 접근 등)만 로그인 후 그 화면으로 가도록 redirect를 넘긴다.
  // 이 페이지에서 로그아웃·세션 종료로 로그인 이동 중이면 붙이지 않는다 (다시 로그인하면 기본 첫 화면).
  const loginPath = isLoginReturnPathSuppressed()
    ? '/login'
    : buildLoginPathWithRedirect(`${location.pathname}${location.search}`)

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (requireAuth && user?.role === 'ADMIN' && requiresMfa && !mfaState?.isVerified) {
    return <Navigate to={loginPath} replace />
  }

  if (requireAuth && passwordChangeRequired) {
    return <Navigate to={PASSWORD_CHANGE_REQUIRED_PATH} replace />
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
