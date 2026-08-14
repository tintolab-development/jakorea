/**
 * Homepage Admin 인증 Zustand 스토어
 */

import { create } from 'zustand'
import type { AuthUser, LoginRequest, MfaState } from '@/entities/auth/model/types'
import {
  login as loginApi,
  type LoginMode,
  type LoginOptions,
} from '@/entities/auth/api/auth-service'
import type { AuthTokenResponse } from '@/features/auth/model/admin-login-api.types'
import { fetchAdminAuthLogout } from '@/features/auth/api/admin-auth-fetcher'
import {
  AUTH_EXPIRY_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from '@/features/auth/model/auth-storage'
import { boardMembersQueryKeys } from '@/features/board-members/api/query-keys'
import { educationBusinessFieldQueryKeys } from '@/features/education-business-field/api/query-keys'
import { educationTargetQueryKeys } from '@/features/education-target/api/query-keys'
import { educationTextbookQueryKeys } from '@/features/education-textbook/api/query-keys'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { footerQueryKeys } from '@/features/footer/api/query-keys'
import { globalValueQueryKeys } from '@/features/global-value/api/query-keys'
import { gnbMenuQueryKeys } from '@/features/gnb-menu/api/query-keys'
import { heroBannerQueryKeys } from '@/features/hero-banner/api/query-keys'
import { historyAwardsCertsQueryKeys } from '@/features/history-awards-certs/api/query-keys'
import { impactStoriesQueryKeys } from '@/features/impact-stories/api/query-keys'
import { jaKoreaBiQueryKeys } from '@/features/ja-korea-bi/api/query-keys'
import { jaKoreaIntroQueryKeys } from '@/features/ja-korea-intro/api/query-keys'
import { jaKoreaWorldwideQueryKeys } from '@/features/ja-korea-worldwide/api/query-keys'
import { mainContentQueryKeys } from '@/features/main-content/api/query-keys'
import { memberLoginLogQueryKeys } from '@/features/member-login-log/api/query-keys'
import { adminAccountLogQueryKeys } from '@/features/admin-account-log/api/query-keys'
import { bugIssueLogQueryKeys } from '@/features/bug-issue-log/api/query-keys'
import { noticesQueryKeys } from '@/features/notices/api/query-keys'
import { organizationChartQueryKeys } from '@/features/organization-chart/api/query-keys'
import { participateQueryKeys } from '@/features/participate/api/query-keys'
import { piiAccessLogQueryKeys } from '@/features/pii-access-log/api/query-keys'
import { popupQueryKeys } from '@/features/popup/api/query-keys'
import { siteInfoQueryKeys } from '@/features/site-info/api/query-keys'
import { socialLinkQueryKeys } from '@/features/social-link/api/query-keys'
import { menuViewStatsQueryKeys } from '@/features/menu-view-stats/api/query-keys'
import { stripBannerQueryKeys } from '@/features/strip-banner/api/query-keys'
import { visitorStatsQueryKeys } from '@/features/visitor-stats/api/query-keys'
import { queryClient } from '@/shared/lib/query-client'
import { refreshAccessTokenSession } from '@/shared/instance/axios-instance'

function elevateAdminToMaster(user: AuthUser): AuthUser {
  if (user.role !== 'ADMIN') return user
  return { ...user, adminLevel: user.adminLevel ?? 'MASTER' }
}

function clearSessionScopedQueryCaches() {
  void queryClient.removeQueries({ queryKey: heroBannerQueryKeys.all })
  void queryClient.removeQueries({ queryKey: popupQueryKeys.all })
  void queryClient.removeQueries({ queryKey: stripBannerQueryKeys.all })
  void queryClient.removeQueries({ queryKey: mainContentQueryKeys.all })
  void queryClient.removeQueries({ queryKey: socialLinkQueryKeys.all })
  void queryClient.removeQueries({ queryKey: noticesQueryKeys.all })
  void queryClient.removeQueries({ queryKey: jaKoreaIntroQueryKeys.all })
  void queryClient.removeQueries({ queryKey: jaKoreaBiQueryKeys.all })
  void queryClient.removeQueries({ queryKey: jaKoreaWorldwideQueryKeys.all })
  void queryClient.removeQueries({ queryKey: globalValueQueryKeys.all })
  void queryClient.removeQueries({ queryKey: historyAwardsCertsQueryKeys.all })
  void queryClient.removeQueries({ queryKey: impactStoriesQueryKeys.all })
  void queryClient.removeQueries({ queryKey: boardMembersQueryKeys.all })
  void queryClient.removeQueries({ queryKey: organizationChartQueryKeys.all })
  void queryClient.removeQueries({ queryKey: educationBusinessFieldQueryKeys.all })
  void queryClient.removeQueries({ queryKey: educationTargetQueryKeys.all })
  void queryClient.removeQueries({ queryKey: educationTextbookQueryKeys.all })
  void queryClient.removeQueries({ queryKey: participateQueryKeys.all })
  void queryClient.removeQueries({ queryKey: siteInfoQueryKeys.all })
  void queryClient.removeQueries({ queryKey: gnbMenuQueryKeys.all })
  void queryClient.removeQueries({ queryKey: footerQueryKeys.all })
  void queryClient.removeQueries({ queryKey: visitorStatsQueryKeys.all })
  void queryClient.removeQueries({ queryKey: menuViewStatsQueryKeys.all })
  void queryClient.removeQueries({ queryKey: piiAccessLogQueryKeys.all })
  void queryClient.removeQueries({ queryKey: fileDownloadLogQueryKeys.all })
  void queryClient.removeQueries({ queryKey: memberLoginLogQueryKeys.all })
  void queryClient.removeQueries({ queryKey: adminAccountLogQueryKeys.all })
  void queryClient.removeQueries({ queryKey: bugIssueLogQueryKeys.all })
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  expiresAt: string | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  mfaState: MfaState | null
  requiresMfa: boolean
  _isCheckingAuth: boolean
  _checkAuthPromise: Promise<void> | null

  login: (
    request: LoginRequest,
    options?: LoginOptions,
  ) => Promise<{ requiresMfa: boolean; mfaState?: MfaState } | void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  completeAdminAuth: (tokens: AuthTokenResponse) => void
  setAuth: (authData: { user: AuthUser; token: string; expiresAt: string }) => void
  refreshToken: () => Promise<boolean>
}

export type { LoginMode, LoginOptions }

function tokenExpiresAtFromResponse(tokens: AuthTokenResponse): string {
  if (tokens.expiresInSeconds && tokens.expiresInSeconds > 0) {
    return new Date(Date.now() + tokens.expiresInSeconds * 1000).toISOString()
  }
  return new Date(Date.now() + 3600 * 1000).toISOString()
}

function persistAuthTokens(
  user: AuthUser,
  tokens: AuthTokenResponse
): { token: string; expiresAt: string } {
  const accessToken = tokens.accessToken
  const expiresAt = tokenExpiresAtFromResponse(tokens)

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
    localStorage.setItem(AUTH_EXPIRY_KEY, expiresAt)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken)
  }

  return { token: accessToken, expiresAt }
}

const loadAuthFromStorage = (): Partial<AuthState> => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
    }
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const expiresAt = localStorage.getItem(AUTH_EXPIRY_KEY)
  const userStr = localStorage.getItem(AUTH_USER_KEY)

  if (token && expiresAt && userStr) {
    if (new Date(expiresAt) > new Date()) {
      try {
        const user = elevateAdminToMaster(JSON.parse(userStr) as AuthUser)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
        return {
          user,
          token,
          expiresAt,
          isAuthenticated: true,
        }
      } catch {
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

const initialState = loadAuthFromStorage()

export const useAuthStore = create<AuthState>()((set, get) => {
  return {
    user: initialState.user ?? null,
    token: initialState.token ?? null,
    expiresAt: initialState.expiresAt ?? null,
    isAuthenticated: initialState.isAuthenticated ?? false,
    loading: false,
    error: null,
    mfaState: null,
    requiresMfa: false,
    _isCheckingAuth: false,
    _checkAuthPromise: null,

    login: async (request: LoginRequest, options?: LoginOptions) => {
      set({ loading: true, error: null })

      try {
        const response = await loginApi(request, options)

        if (response.requiresMfa && response.mfaState) {
          const normalizedUser = elevateAdminToMaster(response.user)
          set({
            user: normalizedUser,
            token: null,
            expiresAt: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            mfaState: response.mfaState,
            requiresMfa: true,
          })
          return { requiresMfa: true, mfaState: response.mfaState }
        }

        const normalizedUser = elevateAdminToMaster(response.user)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(AUTH_TOKEN_KEY, response.token)
          localStorage.setItem(AUTH_EXPIRY_KEY, response.expiresAt)
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
          localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
        }

        clearSessionScopedQueryCaches()

        set({
          user: normalizedUser,
          token: response.token,
          expiresAt: response.expiresAt,
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

    completeAdminAuth: (tokens: AuthTokenResponse) => {
      const state = get()
      if (!state.user) return

      const normalizedUser = elevateAdminToMaster(state.user)
      const { token, expiresAt } = persistAuthTokens(normalizedUser, tokens)

      clearSessionScopedQueryCaches()

      set({
        user: normalizedUser,
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
    },

    setAuth: ({ user, token, expiresAt }) => {
      const normalizedUser = elevateAdminToMaster(user)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_EXPIRY_KEY, expiresAt)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
      }
      set({
        user: normalizedUser,
        token,
        expiresAt,
        isAuthenticated: true,
        mfaState: null,
        requiresMfa: false,
        error: null,
      })
    },

    logout: () => {
      const refreshToken =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
          : null

      let remoteLogout: Promise<void> | undefined
      if (refreshToken) {
        remoteLogout = fetchAdminAuthLogout({ refreshToken })
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_EXPIRY_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
      }

      clearSessionScopedQueryCaches()

      set({
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
        error: null,
        mfaState: null,
        requiresMfa: false,
        _isCheckingAuth: false,
        _checkAuthPromise: null,
      })

      if (remoteLogout) {
        void remoteLogout.catch(error => {
          console.warn('Remote logout failed:', error)
        })
      }
    },

    checkAuth: async () => {
      const state = get()
      if (state._isCheckingAuth && state._checkAuthPromise) {
        return state._checkAuthPromise
      }

      if (typeof window === 'undefined' || !window.localStorage) {
        set({ isAuthenticated: false, user: null })
        return
      }

      let token = localStorage.getItem(AUTH_TOKEN_KEY)
      let expiresAt = localStorage.getItem(AUTH_EXPIRY_KEY)
      const userStr = localStorage.getItem(AUTH_USER_KEY)

      if (!token || !expiresAt || !userStr) {
        set({ isAuthenticated: false, user: null, token: null, expiresAt: null })
        return
      }

      const checkAuthPromise = (async () => {
        try {
          const now = new Date()
          let expiryTime = new Date(expiresAt)
          const bufferTime = 30 * 1000

          if (expiryTime.getTime() <= now.getTime() + bufferTime) {
            const refreshed = await get().refreshToken()
            if (!refreshed) {
              get().logout()
              return
            }
            token = localStorage.getItem(AUTH_TOKEN_KEY)
            expiresAt = localStorage.getItem(AUTH_EXPIRY_KEY)
            if (!token || !expiresAt) {
              get().logout()
              return
            }
            expiryTime = new Date(expiresAt)
          }

          const timeUntilExpiry = expiryTime.getTime() - now.getTime()
          const oneHour = 60 * 60 * 1000
          if (timeUntilExpiry < oneHour && timeUntilExpiry > 0) {
            void get()
              .refreshToken()
              .catch(() => undefined)
          }

          let storedUser: AuthUser | null = null
          try {
            storedUser = JSON.parse(userStr) as AuthUser
          } catch {
            get().logout()
            return
          }

          if (storedUser?.isActive) {
            const normalizedUser = elevateAdminToMaster(storedUser)
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
            set({
              user: normalizedUser,
              token,
              expiresAt,
              isAuthenticated: true,
            })
          } else {
            get().logout()
          }
        } finally {
          set({ _isCheckingAuth: false, _checkAuthPromise: null })
        }
      })()

      set({ _isCheckingAuth: true, _checkAuthPromise: checkAuthPromise })
      return checkAuthPromise
    },

    clearError: () => set({ error: null }),

    refreshToken: async () => refreshAccessTokenSession(),
  }
})
