/**
 * 회원가입 Hook
 * Phase 0.1.2: 회원가입 흐름 (FR-B01, FR-B02)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { register } from '@/entities/user/api/register-service'
import type { RegisterRequest, RegisterResponse } from '@/types/register'

interface UseRegisterReturn {
  loading: boolean
  error: Error | null
  register: (request: RegisterRequest) => Promise<RegisterResponse | void>
  clearError: () => void
}

export function useRegister(): UseRegisterReturn {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleRegister = async (request: RegisterRequest): Promise<RegisterResponse | void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await register(request)
      message.success(MESSAGES.success.registerCompleted)
      // 회원가입 성공 시 로그인 페이지로 이동
      navigate('/login', { replace: true })
      return response
    } catch (err) {
      const error = err instanceof Error ? err : new Error('회원가입에 실패했습니다.')
      setError(error)
      message.error(error.message)
      throw error
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
