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
import {
  notifyServerActivityRecorded,
  startUserActivityTracking,
} from '@/features/auth/lib/session-keepalive'
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
    // 앱 시작 시 인증 상태 확인.
    // access token은 메모리에만 있어 새로고침하면 사라진다 (QA-0137). 저장된 사용자와 refresh 수단으로
    // 복원한 세션이면 checkAuth가 refresh로 토큰을 다시 받고, 실패했을 때만 logout한다.
    // 복원할 수 없으면(refresh 수단 없음) 스토어가 이미 비로그인 상태로 시작한다.
    const initAuth = async () => {
      if (!useAuthStore.getState().isAuthenticated) return
      try {
        await checkAuth()
      } catch (error) {
        console.error('Auth check failed in AuthProvider:', error)
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
      void postAdminAuthActivity()
        .then(result => {
          const current = useAuthStore.getState()
          if (!current.isAuthenticated || current.token !== requestedToken) return
          // 서버 유휴 기한이 바뀌었으면 세션 경고 타이머가 새 기한을 다시 읽는다.
          if (result?.updated) notifyServerActivityRecorded()
        })
        .catch(error => {
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
