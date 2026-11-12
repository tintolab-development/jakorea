/**
 * 인증 Provider
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 0.5.5: 세션/접근 통제 UX - 세션 경고 모달 통합
 * FSD: shared에 AuthContext 값을 주입하여 shared가 features/auth를 직접 참조하지 않도록 함
 */

import { useEffect, useMemo } from 'react'
import {
  postAdminAuthActivity,
  isAdminAuthUnauthorizedError,
  isAdminAuthForbiddenError,
} from '@/features/auth/api/admin-session-fetcher'
import { startUserActivityTracking } from '@/features/auth/lib/session-keepalive'
import { hasRefreshCredential } from '@/features/auth/lib/refresh-credential'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { SessionWarningModal } from '@/features/auth/ui/session-warning-modal'
import { AuthContextProvider } from '@/shared/lib/auth/auth-context'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const store = useAuthStore()
  const { checkAuth, isAuthenticated } = store // isAuthenticated: 세션 만료 폴링용

  const authContextValue = useMemo(
    () => ({
      user: store.user,
      isAuthenticated: store.isAuthenticated,
      loading: store.loading,
      checkAuth: store.checkAuth,
      logout: () => useAuthStore.getState().logout(),
      updateUser: store.updateUser,
      requiresMfa: store.requiresMfa,
      mfaState: store.mfaState,
      expiresAt: store.expiresAt,
    }),
    [
      store.user,
      store.isAuthenticated,
      store.loading,
      store.checkAuth,
      store.updateUser,
      store.requiresMfa,
      store.mfaState,
      store.expiresAt,
    ]
  )

  useEffect(() => {
    // 앱 시작 시 인증 상태 확인
    // localStorage에 토큰이 있으면 검증
    const initAuth = async () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedToken = localStorage.getItem('auth_token')
        const expiresAt = localStorage.getItem('auth_expires_at')

        if (storedToken && expiresAt) {
          // 만료 시간 확인 (30초 버퍼 추가)
          const expiryTime = new Date(expiresAt).getTime()
          const now = Date.now()
          const bufferTime = 30 * 1000 // 30초 버퍼

          if (expiryTime > now + bufferTime) {
            try {
              await checkAuth()
            } catch (error) {
              console.error('Auth check failed in AuthProvider:', error)
            }
          } else if (hasRefreshCredential()) {
            // access가 만료됐어도 refresh 수단(refresh token 또는 QA-0137 HttpOnly 쿠키 세션)이 있으면 refresh-first.
            // checkAuth가 refresh하고, 실패했을 때만 logout한다.
            try {
              await checkAuth()
            } catch (error) {
              console.error('Auth check failed in AuthProvider:', error)
            }
          } else {
            // 만료됐고 refresh 수단도 없으면 로그아웃
            useAuthStore.getState().logout()
          }
        }
      }
    }

    initAuth()
  }, []) // 초기 마운트 시에만 실행 (의존성 배열 비워서 한 번만 실행)

  // 세션 만료 확인
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // 활동 추적 (선제 refresh 게이트: 최근 30분 내 활동 + 마지막 발급 후 20분 경과)
    const stopActivityTracking = startUserActivityTracking(window, () => {
      const initial = useAuthStore.getState()
      if (!initial.isAuthenticated || !initial.token) return
      const requestedToken = initial.token
      void postAdminAuthActivity().catch(error => {
        const current = useAuthStore.getState()
        // A delayed 401 from the previous access token must not end a refreshed login.
        if (!current.isAuthenticated || current.token !== requestedToken) return
        if (isAdminAuthUnauthorizedError(error)) {
          current.logout()
        } else if (isAdminAuthForbiddenError(error)) {
          // Permission/account-type mismatch is not token expiration.
          console.warn('[ADMIN_SESSION] Activity was denied (403); verify ADMIN JWT and sid.')
        }
      })
    })

    // 만료만 보고 바로 logout하지 않는다: refresh-first, 실패 시에만 logout (store.checkSessionExpiry)
    const checkSessionExpiry = () => {
      useAuthStore.getState().checkSessionExpiry()
    }

    // 주기적으로 세션 만료 확인 (1분마다)
    const interval = setInterval(checkSessionExpiry, 60 * 1000)

    return () => {
      clearInterval(interval)
      stopActivityTracking()
    }
  }, [isAuthenticated])

  return (
    <AuthContextProvider value={authContextValue}>
      {children}
      {/* Phase 0.5.5: 세션 만료 경고 모달 */}
      <SessionWarningModal />
    </AuthContextProvider>
  )
}
