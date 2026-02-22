/**
 * 인증 Provider
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 0.5.5: 세션/접근 통제 UX - 세션 경고 모달 통합
 * FSD: shared에 AuthContext 값을 주입하여 shared가 features/auth를 직접 참조하지 않도록 함
 */

import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { SessionWarningModal } from '@/features/auth/ui/session-warning-modal'
import { AuthContextProvider } from '@/shared/lib/auth/auth-context'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const store = useAuthStore()
  const { checkAuth, isAuthenticated } = store

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
            // 만료되지 않았으면 인증 확인
            if (!isAuthenticated) {
              try {
                await checkAuth()
              } catch (error) {
                console.error('Auth check failed in AuthProvider:', error)
                // 에러 발생 시에도 계속 진행 (사용자 정보가 있으면 유지)
              }
            }
          } else {
            // 만료되었으면 로그아웃
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

    const checkSessionExpiry = () => {
      const expiresAt = localStorage.getItem('auth_expires_at')
      if (expiresAt) {
        const expiryTime = new Date(expiresAt).getTime()
        const now = Date.now()
        const bufferTime = 30 * 1000 // 30초 버퍼
        if (expiryTime <= now + bufferTime) {
          // 세션이 만료되었으면 로그아웃
          useAuthStore.getState().logout()
        }
      }
    }

    // 주기적으로 세션 만료 확인 (1분마다)
    const interval = setInterval(checkSessionExpiry, 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  return (
    <AuthContextProvider value={authContextValue}>
      {children}
      {/* Phase 0.5.5: 세션 만료 경고 모달 */}
      <SessionWarningModal />
    </AuthContextProvider>
  )
}
