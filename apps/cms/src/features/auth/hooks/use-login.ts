/**
 * 로그인 Hook
 * Phase 0.1.3: 로그인 흐름 개선
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import type { LoginRequest } from '@/types/user'

interface UseLoginReturn {
  loading: boolean
  error: Error | null
  login: (request: LoginRequest) => Promise<void>
  clearError: () => void
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const { login: loginStore, loading, error, clearError: clearErrorStore } = authStore

  const login = useCallback(
    async (request: LoginRequest) => {
      try {
        const result = await loginStore(request)

        // MFA 필요 시는 모달이 열리므로 여기서는 처리하지 않음
        if (result?.requiresMfa) {
          return
        }

        // Phase 0.1.3: 역할별 리다이렉트
        const currentUser = authStore.user
        if (currentUser) {
          const redirectPath = getRedirectPathByRole(currentUser)
          message.success('로그인 성공')
          navigate(redirectPath, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('로그인에 실패했습니다.')
        message.error(error.message)
        throw error
      }
    },
    [loginStore, authStore.user, navigate]
  )

  return {
    loading,
    error,
    login,
    clearError: clearErrorStore,
  }
}
