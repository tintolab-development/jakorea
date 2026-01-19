/**
 * 인증 Provider
 * Phase 4.1.1: 사용자 인증 시스템
 */

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // 앱 시작 시 인증 상태 확인
    // localStorage에 토큰이 있으면 검증
    const initAuth = async () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedToken = localStorage.getItem('auth_token')
        const expiresAt = localStorage.getItem('auth_expires_at')
        
        if (storedToken && expiresAt) {
          // 만료 시간 확인
          const expiryTime = new Date(expiresAt).getTime()
          const now = Date.now()
          
          if (expiryTime > now) {
            // 만료되지 않았으면 인증 확인
            if (!isAuthenticated) {
              await checkAuth()
            }
          } else {
            // 만료되었으면 로그아웃
            useAuthStore.getState().logout()
          }
        }
      }
    }

    initAuth()
  }, [checkAuth, isAuthenticated]) // 초기 마운트 시에만 실행

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
        if (expiryTime <= now) {
          // 세션이 만료되었으면 로그아웃
          useAuthStore.getState().logout()
        }
      }
    }

    // 주기적으로 세션 만료 확인 (1분마다)
    const interval = setInterval(checkSessionExpiry, 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  return <>{children}</>
}

