/**
 * 보호된 라우트 — 미인증 시 /login 리다이렉트
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user, requiresMfa, mfaState } = useAuthStore()

  if (requireAuth && !isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (requireAuth && user?.role === 'ADMIN' && requiresMfa && !mfaState?.isVerified) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
