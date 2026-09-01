/**
 * 회원가입 Hook
 * Phase 0.1.2: 회원가입 흐름 (FR-B01, FR-B02)
 * FR-C01: redirectPath 지원 — 신청 유도 후 회원가입 시 로그인 redirect 유지
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '@/entities/user/api/register-service'
import type { RegisterRequest, RegisterResponse } from '@/types/register'

interface UseRegisterOptions {
  /** 로그인 페이지로 이동 시 넘길 redirect 쿼리 (예: /programs/:id/apply) */
  redirectPath?: string
}

interface UseRegisterReturn {
  loading: boolean
  error: Error | null
  register: (request: RegisterRequest) => Promise<RegisterResponse | void>
  clearError: () => void
}

export function useRegister(options: UseRegisterOptions = {}): UseRegisterReturn {
  const { redirectPath } = options
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleRegister = async (request: RegisterRequest): Promise<RegisterResponse | void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await register(request)
      const loginUrl = redirectPath
        ? `/login?redirect=${encodeURIComponent(redirectPath)}`
        : '/login'
      navigate(loginUrl, { replace: true })
      return response
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('회원가입에 실패했습니다.')
      setError(errObj)
      throw errObj
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    loading,
    error,
    register: handleRegister,
    clearError,
  }
}
