/**
 * Homepage Admin 인증 Zustand 스토어
 */

import { create } from 'zustand'
import { readJwtSidClaim } from '@jakorea/domain/session'
import type { AuthUser, LoginRequest, MfaState } from '@/entities/auth/model/types'
import { hasRemoteAdminJwt, login as loginApi } from '@/entities/auth/api/auth-service'
import type { AuthTokenResponse } from '@/features/auth/model/admin-login-api.types'
import {
  fetchAdminAuthLogout,
  fetchAdminAuthRefreshCookieLogout,
} from '@/features/auth/api/admin-auth-fetcher'
import {
  clearRefreshCredential,
  hasRefreshCredential,
  storeRefreshTokenFromResponse,
} from '@/features/auth/lib/refresh-credential'
import {
  AUTH_EXPIRY_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from '@/features/auth/model/auth-storage'
import {
  clearTokenIssuedAt,
  getLastUserActivityAt,
  readTokenIssuedAt,
  recordTokenIssuedAt,
  shouldProactivelyRefresh,
} from '@/features/auth/lib/session-keepalive'
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
import { adminMeQueryKeys } from '@/features/auth/api/admin-me-query-keys'
import { systemInboxQueryKeys } from '@/features/system-inbox/api/query-keys'
import { queryClient } from '@/shared/lib/query-client'
import { refreshAccessTokenSession } from '@/shared/instance/axios-instance'

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
  void queryClient.removeQueries({ queryKey: systemInboxQueryKeys.all })
  void queryClient.removeQueries({ queryKey: adminMeQueryKeys.all })
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
  /** 부트 시 저장된 access token이 만료 임박이라 서버 갱신 결과를 기다리는 중 */
  isBootstrapping: boolean
  _isCheckingAuth: boolean
  _checkAuthPromise: Promise<void> | null

  login: (request: LoginRequest) => Promise<{ requiresMfa: boolean; mfaState?: MfaState } | void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  completeAdminAuth: (tokens: AuthTokenResponse) => void
  setAuth: (authData: { user: AuthUser; token: string; expiresAt: string }) => void
  refreshToken: () => Promise<boolean>
  checkSessionExpiry: () => boolean
}

/** 만료 임박 판단 버퍼. access TTL과 같은 고정 1h 임계값은 쓰지 않는다. */
export const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 30 * 1000

export function shouldRefreshAccessToken(expiresAtMs: number, nowMs: number): boolean {
  return expiresAtMs <= nowMs + ACCESS_TOKEN_EXPIRY_BUFFER_MS
}

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
  }
  // QA-0137: 본문에 refreshToken이 없으면 undefined로 덮지 않고 HttpOnly 쿠키 세션으로 표시
  storeRefreshTokenFromResponse(tokens.refreshToken)
  recordTokenIssuedAt()

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
    // refresh 수단 = 저장된 refreshToken(전환기) 또는 HttpOnly 쿠키 세션 표시(QA-0137)
    const hasRefreshToken = hasRefreshCredential()
    if (new Date(expiresAt) > new Date() || hasRefreshToken) {
      try {
        const user = JSON.parse(userStr) as AuthUser
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

/** 저장된 세션이 있지만 access token 갱신이 필요하면, 갱신 결과 전까지 보호 화면을 그리지 않는다. */
const initialIsBootstrapping =
  !!initialState.isAuthenticated &&
  !!initialState.expiresAt &&
  shouldRefreshAccessToken(new Date(initialState.expiresAt).getTime(), Date.now())

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
    isBootstrapping: initialIsBootstrapping,
    _isCheckingAuth: false,
    _checkAuthPromise: null,

    login: async (request: LoginRequest) => {
      set({ loading: true, error: null })

      try {
        const response = await loginApi(request)

        if (response.requiresMfa && response.mfaState) {
          const normalizedUser = response.user
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

        const normalizedUser = response.user
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(AUTH_TOKEN_KEY, response.token)
          localStorage.setItem(AUTH_EXPIRY_KEY, response.expiresAt)
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
        }
        clearRefreshCredential()
        recordTokenIssuedAt()

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

      const normalizedUser = state.user
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
      const normalizedUser = user
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_EXPIRY_KEY, expiresAt)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
      }
      recordTokenIssuedAt()
      clearSessionScopedQueryCaches()
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

      // QA-0137: 저장 refreshToken·쿠키 세션 표시·실 JWT 중 하나라도 있으면 실 세션 (mock·MFA pending 제외)
      const hadRemoteSession = Boolean(refreshToken) || hasRefreshCredential() || hasRemoteAdminJwt()

      // TODO(QA-0137 인프라 전환 후 삭제): 저장된 refreshToken이 사라지면 본문 logout 분기를 지운다.
      let remoteLogout: Promise<void> | undefined
      if (refreshToken) {
        remoteLogout = fetchAdminAuthLogout({ refreshToken })
      }
      // QA-0137: HttpOnly refresh 쿠키 폐기·삭제. best effort — 실패해도 로컬 로그아웃은 그대로 진행한다.
      if (hadRemoteSession) {
        void fetchAdminAuthRefreshCookieLogout()
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_EXPIRY_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
      }
      clearRefreshCredential()
      clearTokenIssuedAt()

      clearSessionScopedQueryCaches()

      set({
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
        error: null,
        mfaState: null,
        requiresMfa: false,
        isBootstrapping: false,
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
        set({ isAuthenticated: false, user: null, isBootstrapping: false })
        return
      }

      let token = localStorage.getItem(AUTH_TOKEN_KEY)
      let expiresAt = localStorage.getItem(AUTH_EXPIRY_KEY)
      const userStr = localStorage.getItem(AUTH_USER_KEY)
      const tokenAtStart = token
      const sidAtStart = readJwtSidClaim(token)
      const isCurrentLogin = () => Boolean(token) &&
        localStorage.getItem(AUTH_TOKEN_KEY) === token &&
        localStorage.getItem(AUTH_USER_KEY) === userStr &&
        (sidAtStart ? readJwtSidClaim(token) === sidAtStart : token === tokenAtStart)

      if (!token || !expiresAt || !userStr) {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          expiresAt: null,
          isBootstrapping: false,
        })
        return
      }

      const checkAuthPromise = (async () => {
        try {
          const now = new Date()
          const expiryTime = new Date(expiresAt)

          if (shouldRefreshAccessToken(expiryTime.getTime(), now.getTime())) {
            const refreshed = await get().refreshToken()
            if (!refreshed) {
              if (isCurrentLogin()) get().logout()
              return
            }
            token = localStorage.getItem(AUTH_TOKEN_KEY)
            expiresAt = localStorage.getItem(AUTH_EXPIRY_KEY)
            if (!token || !expiresAt) {
              if (!localStorage.getItem(AUTH_TOKEN_KEY)) get().logout()
              return
            }
            if (!isCurrentLogin()) return
          }

          if (!isCurrentLogin()) return
          let storedUser: AuthUser | null = null
          try {
            storedUser = JSON.parse(userStr) as AuthUser
          } catch {
            if (isCurrentLogin()) get().logout()
            return
          }

          if (storedUser?.isActive) {
            const normalizedUser = storedUser
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))
            set({
              user: normalizedUser,
              token,
              expiresAt,
              isAuthenticated: true,
            })
          } else {
            if (isCurrentLogin()) get().logout()
          }
        } finally {
          set({ _isCheckingAuth: false, _checkAuthPromise: null, isBootstrapping: false })
        }
      })()

      set({ _isCheckingAuth: true, _checkAuthPromise: checkAuthPromise })
      return checkAuthPromise
    },

    clearError: () => set({ error: null }),

    refreshToken: async () => refreshAccessTokenSession(),

    /**
     * 세션 keep-alive 점검 (AuthProvider가 60초마다 호출). 만료만 보고 바로 logout하지 않는다.
     * 1) access 만료 임박(30초 버퍼): refresh를 먼저 시도하고, 실패할 때만 logout.
     * 2) 아직 여유가 있어도, 사용자가 최근 30분 내 활동했고 마지막 발급 후 20분이 지났으면 선제 refresh.
     *    선제 refresh 실패는 logout하지 않는다.
     */
    checkSessionExpiry: (): boolean => {
      const state = get()
      const hasStorage = typeof window !== 'undefined' && !!window.localStorage
      const expiresAt = (hasStorage ? localStorage.getItem(AUTH_EXPIRY_KEY) : null) ?? state.expiresAt
      if (!expiresAt) {
        return true
      }

      const nowMs = Date.now()
      const nearExpiry = shouldRefreshAccessToken(new Date(expiresAt).getTime(), nowMs)
      const proactive =
        !nearExpiry &&
        shouldProactivelyRefresh({
          nowMs,
          lastIssuedAtMs: readTokenIssuedAt(),
          lastActivityAtMs: getLastUserActivityAt(),
        })
      if (!nearExpiry && !proactive) {
        return false
      }

      const refreshToken = hasStorage ? localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) : null
      // QA-0137: 저장된 refreshToken이 없어도 HttpOnly 쿠키 세션이면 refresh를 시도한다
      if (!refreshToken && !hasRefreshCredential()) {
        if (nearExpiry) {
          get().logout()
          return true
        }
        return false
      }

      const accessAtRefreshStart = state.token
      const refreshAtRefreshStart = refreshToken
      void get()
        .refreshToken()
        .then(ok => {
          if (ok || !nearExpiry) return
          const current = get()
          // Another tab or login may have rotated the session while this refresh
          // was in flight. Never revoke that replacement because of an old failure.
          const storedAccess = hasStorage ? localStorage.getItem(AUTH_TOKEN_KEY) : current.token
          const storedRefresh = hasStorage ? localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) : refreshAtRefreshStart
          if (current.isAuthenticated &&
              current.token === accessAtRefreshStart &&
              storedAccess === accessAtRefreshStart &&
              storedRefresh === refreshAtRefreshStart) {
            current.logout()
          }
        })
      return false
    },
  }
})
