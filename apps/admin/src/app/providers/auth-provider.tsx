/**
 * 인증 Provider — 부트 시 세션 복원·만료 점검
 */

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  AUTH_EXPIRY_KEY,
  AUTH_TOKEN_KEY,
} from '@/features/auth/model/auth-storage'

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
          if (!isAuthenticated) {
            try {
              await checkAuth()
            } catch (error) {
              console.error('Auth check failed in AuthProvider:', error)
            }
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

    const checkSessionExpiry = () => {
      const expiresAt = localStorage.getItem(AUTH_EXPIRY_KEY)
      if (expiresAt) {
        const expiryTime = new Date(expiresAt).getTime()
        const now = Date.now()
        const bufferTime = 30 * 1000
        if (expiryTime <= now + bufferTime) {
          useAuthStore.getState().logout()
        }
      }
    }

    const interval = setInterval(checkSessionExpiry, 60 * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  return <>{children}</>
}
