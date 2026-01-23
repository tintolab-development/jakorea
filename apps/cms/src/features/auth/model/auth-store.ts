/**
 * 인증 상태 관리 스토어
 * Phase 4.1.1: 사용자 인증 시스템
 */

import { create } from 'zustand'
import type { User, LoginRequest } from '@/types/user'
import type { MfaState } from '@/types/mfa'
import { login as loginApi, validateToken } from '@/entities/user/api/auth-service'

interface AuthState {
  user: Omit<User, 'password'> | null
  token: string | null
  expiresAt: string | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  mfaState: MfaState | null // Phase 0.5.1: MFA 상태
  requiresMfa: boolean // Phase 0.5.1: MFA 필요 여부

  // Actions
  login: (request: LoginRequest) => Promise<{ requiresMfa: boolean; mfaState?: MfaState } | void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (userData: Partial<Omit<User, 'password'>>) => void
  clearError: () => void
  setMfaVerified: () => void // Phase 0.5.1: MFA 인증 완료 처리
  setAuth: (authData: { user: Omit<User, 'password'>; token: string; expiresAt: string }) => void // Phase 0.1.3: 인증 상태 직접 설정
  refreshToken: () => Promise<boolean> // Phase 0.5: 토큰 갱신 Mock 로직
  checkSessionExpiry: () => boolean // Phase 0.5: 세션 만료 확인
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
    mfaState: null, // Phase 0.5.1: MFA 상태
    requiresMfa: false, // Phase 0.5.1: MFA 필요 여부

    login: async (request: LoginRequest) => {
      set({ loading: true, error: null })

      try {
        const response = await loginApi(request)

        // MFA 필요 시 MFA 상태만 설정하고 인증은 완료하지 않음
        if (response.requiresMfa && response.mfaState) {
          set({
            user: response.user,
            token: null, // MFA 완료 전에는 토큰 저장 안 함
            expiresAt: null,
            isAuthenticated: false, // MFA 완료 전에는 인증되지 않음
            loading: false,
            error: null,
            mfaState: response.mfaState,
            requiresMfa: true,
          })
          return { requiresMfa: true, mfaState: response.mfaState }
        }

        // MFA 불필요 시 바로 인증 완료
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
          mfaState: null,
          requiresMfa: false,
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('로그인에 실패했습니다.')
        set({
          loading: false,
          error,
          isAuthenticated: false,
          mfaState: null,
          requiresMfa: false,
        })
        throw error
      }
    },

    setMfaVerified: () => {
      const state = get()
      if (state.user) {
        // MFA 완료 후 토큰 생성 및 저장
        const token = `mock-jwt-token-${state.user.id}-${Date.now()}`
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token)
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt)
          localStorage.setItem('auth_user', JSON.stringify(state.user))
        }

        set({
          token,
          expiresAt,
          isAuthenticated: true,
          mfaState: state.mfaState
            ? {
                ...state.mfaState,
                isVerified: true,
              }
            : null,
          requiresMfa: false,
        })
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
        mfaState: null, // Phase 0.5.1: MFA 상태 초기화
        requiresMfa: false, // Phase 0.5.1: MFA 필요 여부 초기화
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

      // Phase 0.5: 세션 만료 확인
      const now = new Date()
      const expiryTime = new Date(expiresAt)

      if (expiryTime <= now) {
        // 만료된 경우 로그아웃
        get().logout()
        return
      }

      // Phase 0.5: 토큰 갱신 필요 여부 확인 (만료 1시간 전)
      const timeUntilExpiry = expiryTime.getTime() - now.getTime()
      const oneHour = 60 * 60 * 1000

      if (timeUntilExpiry < oneHour && timeUntilExpiry > 0) {
        // 자동 토큰 갱신 시도 (백그라운드)
        get()
          .refreshToken()
          .catch(() => {
            // 갱신 실패는 조용히 처리 (사용자에게 노출하지 않음)
          })
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

    updateUser: (userData: Partial<Omit<User, 'password'>>) => {
      const currentUser = get().user
      if (!currentUser) return

      const updatedUser = { ...currentUser, ...userData }

      // localStorage 업데이트
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      }

      set({ user: updatedUser })
    },

    clearError: () => {
      set({ error: null })
    },

    // Phase 0.1.3: 인증 상태 직접 설정 (휴대폰/소셜 로그인용)
    setAuth: (authData: { user: Omit<User, 'password'>; token: string; expiresAt: string }) => {
      // localStorage에 저장
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(TOKEN_STORAGE_KEY, authData.token)
        localStorage.setItem(TOKEN_EXPIRY_KEY, authData.expiresAt)
        localStorage.setItem('auth_user', JSON.stringify(authData.user))
      }

      set({
        user: authData.user,
        token: authData.token,
        expiresAt: authData.expiresAt,
        isAuthenticated: true,
        loading: false,
        error: null,
        mfaState: null,
        requiresMfa: false,
      })
    },

    // Phase 0.5: 토큰 갱신 Mock 로직
    refreshToken: async (): Promise<boolean> => {
      const state = get()
      if (!state.user || !state.token) {
        return false
      }

      try {
        // Mock: 토큰 갱신 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 300))

        // 새 토큰 생성
        const newToken = `mock-jwt-token-${state.user.id}-${Date.now()}`
        const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후

        // localStorage 업데이트
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
          localStorage.setItem(TOKEN_EXPIRY_KEY, newExpiresAt)
        }

        set({
          token: newToken,
          expiresAt: newExpiresAt,
        })

        return true
      } catch (error) {
        console.error('Token refresh failed:', error)
        return false
      }
    },

    // Phase 0.5: 세션 만료 확인
    checkSessionExpiry: (): boolean => {
      const state = get()
      if (!state.expiresAt) {
        return true // 만료된 것으로 간주
      }

      const now = new Date()
      const expiryTime = new Date(state.expiresAt)

      if (expiryTime <= now) {
        // 만료된 경우 로그아웃
        get().logout()
        return true
      }

      return false
    },
  }
})
