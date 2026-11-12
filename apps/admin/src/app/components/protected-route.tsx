/**
 * 보호된 라우트 — 미인증 시 /login 리다이렉트
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { buildLoginPathWithRedirect } from '@/shared/lib/login-redirect'
import { PageContentLoading } from '@/shared/ui/page-content-loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isBootstrapping, user, requiresMfa, mfaState } = useAuthStore()

  // 만료된 토큰 갱신 결과 전에는 보호 화면을 그리지 않는다 (메인 → 로그인 깜빡임 방지).
  if (requireAuth && isBootstrapping) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PageContentLoading aria-label="로그인 정보 확인 중" />
      </div>
    )
  }

  // 로그인 후 원래 화면으로 돌아오도록 현재 경로를 redirect로 넘긴다.
  const loginPath = buildLoginPathWithRedirect(`${location.pathname}${location.search}`)

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (requireAuth && user?.role === 'ADMIN' && requiresMfa && !mfaState?.isVerified) {
    return <Navigate to={loginPath} replace />
  }

  return <>{children}</>
}
