/**
 * 인증 Provider — 부트 시 세션 복원·만료 점검
 */

import { useEffect } from 'react'
import { sendUserActivity } from '@/features/auth/lib/send-user-activity'
import { startUserActivityTracking } from '@/features/auth/lib/session-keepalive'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { SessionWarningModal } from '@/features/auth/ui/session-warning-modal'
import { BootstrapSessionNotice } from '@/features/auth/ui/bootstrap-session-notice'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // QA-0137: access token은 메모리에만 있으므로 새로고침하면 저장된 사용자 + refresh 수단으로 다시 받는다.
    // 저장된 사용자가 없으면 checkAuth가 비로그인으로 정리하고, refresh 실패는 로그아웃으로 이어진다.
    void checkAuth().catch(error => {
      console.error('Auth check failed in AuthProvider:', error)
    })
    // 초기 마운트 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const stopActivityTracking = startUserActivityTracking(window, () => {
      void sendUserActivity()
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
      <BootstrapSessionNotice />
    </>
  )
}
