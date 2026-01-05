/**
 * 인증 상태 관리 스토어
 * Phase 4.1.1: 사용자 인증 시스템
 */

import { create } from 'zustand'
import type { User, LoginRequest, LoginResponse } from '@/types/user'
import { login as loginApi, validateToken } from '@/entities/user/api/auth-service'

interface AuthState {
  user: Omit<User, 'password'> | null
  token: string | null
  expiresAt: string | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean

  // Actions
  login: (request: LoginRequest) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

const TOKEN_STORAGE_KEY = 'auth_token'
const TOKEN_EXPIRY_KEY = 'auth_expires_at'

// localStorage에서 인증 상태 복원
const loadAuthFromStorage = (): Partial<AuthState> => {
  // 브라우저 환경 확인
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
    }
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY)
  const userStr = localStorage.getItem('auth_user')

  if (token && expiresAt && userStr) {
    // 만료 확인
    if (new Date(expiresAt) > new Date()) {
      try {
        const user = JSON.parse(userStr)
        return {
          user,
          token,
          expiresAt,
          isAuthenticated: true,
        }
      } catch {
        // JSON 파싱 실패 시 초기화
        return {
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
        }
      }
    }
  }

  return {
    user: null,
    token: null,
    expiresAt: null,
    isAuthenticated: false,
  }
}

// 초기 상태를 즉시 로드
const initialState = loadAuthFromStorage()

export const useAuthStore = create<AuthState>()((set, get) => {
  return {
    user: initialState.user ?? null,
    token: initialState.token ?? null,
    expiresAt: initialState.expiresAt ?? null,
    isAuthenticated: initialState.isAuthenticated ?? false,
    loading: false,
    error: null,

    login: async (request: LoginRequest) => {
      set({ loading: true, error: null })

      try {
        const response: LoginResponse = await loginApi(request)

        // localStorage에 저장
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(TOKEN_STORAGE_KEY, response.token)
          localStorage.setItem(TOKEN_EXPIRY_KEY, response.expiresAt.toString())
          localStorage.setItem('auth_user', JSON.stringify(response.user))
        }

        set({
          user: response.user,
          token: response.token,
          expiresAt: response.expiresAt.toString(),
          isAuthenticated: true,
          loading: false,
          error: null,
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('로그인에 실패했습니다.')
        set({
          loading: false,
          error,
          isAuthenticated: false,
        })
        throw error
      }
    },

    logout: () => {
      // localStorage 정리
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(TOKEN_EXPIRY_KEY)
        localStorage.removeItem('auth_user')
      }

      set({
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
        error: null,
      })
    },

    checkAuth: async () => {
      // localStorage에서 직접 토큰 확인
      if (typeof window === 'undefined' || !window.localStorage) {
        set({ isAuthenticated: false, user: null })
        return
      }

      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY)
      const userStr = localStorage.getItem('auth_user')

      if (!token || !expiresAt || !userStr) {
        set({ isAuthenticated: false, user: null, token: null, expiresAt: null })
        return
      }

      // 만료 확인
      if (new Date(expiresAt) <= new Date()) {
        get().logout()
        return
      }

      try {
        const user = await validateToken(token)
        if (user) {
          // localStorage 업데이트
          localStorage.setItem('auth_user', JSON.stringify(user))

          set({
            user,
            token,
            expiresAt,
            isAuthenticated: true,
          })
        } else {
          // 토큰이 유효하지 않으면 로그아웃
          get().logout()
        }
      } catch {
        get().logout()
      }
    },

    clearError: () => {
      set({ error: null })
    },
  }
})

