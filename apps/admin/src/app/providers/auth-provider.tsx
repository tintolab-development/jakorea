/**
 * 인증 Provider — 부트 시 세션 복원·만료 점검
 */

import { useEffect } from 'react'
import {
  isAdminAuthForbiddenError,
  isAdminAuthUnauthorizedError,
  postAdminAuthActivity,
} from '@/features/auth/api/admin-session-fetcher'
import { startUserActivityTracking } from '@/features/auth/lib/session-keepalive'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { AUTH_EXPIRY_KEY, AUTH_TOKEN_KEY } from '@/features/auth/model/auth-storage'
import { hasRefreshCredential } from '@/features/auth/lib/refresh-credential'
import { SessionWarningModal } from '@/features/auth/ui/session-warning-modal'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined' || !window.localStorage) return

      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
      const expiresAt = localStorage.getItem(AUTH_EXPIRY_KEY)

      if (storedToken && expiresAt) {
        const expiryTime = new Date(expiresAt).getTime()
        const now = Date.now()
        const bufferTime = 30 * 1000

        if (expiryTime > now + bufferTime) {
          try {
            await checkAuth()
          } catch (error) {
            console.error('Auth check failed in AuthProvider:', error)
          }
        } else if (hasRefreshCredential()) {
          // QA-0137: 저장된 refreshToken(전환기) 또는 HttpOnly 쿠키 세션 표시
          try {
            await checkAuth()
          } catch (error) {
            console.error('Auth check failed in AuthProvider:', error)
          }
        } else {
          useAuthStore.getState().logout()
        }
      }
    }

    void initAuth()
    // 초기 마운트 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

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

    const interval = setInterval(() => {
      useAuthStore.getState().checkSessionExpiry()
    }, 60 * 1000)

    return () => {
      clearInterval(interval)
      stopActivityTracking()
    }
  }, [isAuthenticated])

  return (
    <>
      {children}
      <SessionWarningModal />
    </>
  )
}
