/**
 * Homepage Admin 인증 Zustand 스토어
 */

import { create } from 'zustand'
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
  AUTH_USER_KEY,
  removeLegacyStoredAccessToken,
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
import { bumpAuthGeneration } from '@/features/auth/lib/auth-generation'
import {
  refreshAccessTokenSession,
  refreshAccessTokenSessionWithResult,
} from '@/shared/instance/axios-instance'
import {
  BOOTSTRAP_REFRESH_NOTICE_DELAY_MS,
  BOOTSTRAP_REFRESH_RETRY_DELAY_MS,
  type RefreshFailureKind,
} from '@/features/auth/lib/refresh-failure'

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
  /** 부트(새로고침) 시 refresh로 메모리 access token을 다시 받는 중 — 결과 전까지 보호 화면을 그리지 않는다 */
  isBootstrapping: boolean
  _isCheckingAuth: boolean
  _checkAuthPromise: Promise<void> | null
  /**
   * 새로고침 세션 복원 실패 안내 (새로고침 전 로그인 상태였던 경우만).
   * session-ended: 세션 만료·폐기 → 로그인 화면 안내. unreachable: 네트워크·5xx → 로딩 화면 위 재시도 안내.
   */
  bootstrapNotice: BootstrapNotice | null
  /** unreachable 안내의 [다시 시도] 진행 중 */
  bootstrapRetrying: boolean

  login: (request: LoginRequest) => Promise<{ requiresMfa: boolean; mfaState?: MfaState } | void>
  /** skipRemote: 다른 탭이 이미 서버 로그아웃을 끝낸 경우(storage 이벤트) 로컬 정리만 한다 */
  logout: (options?: { skipRemote?: boolean }) => void
  /** 로그인·MFA 완료 공통 저장. access token은 메모리에만 둔다. */
  applyAuthSession: (session: { user: AuthUser; token: string; expiresAt: string }) => void
  checkAuth: () => Promise<void>
  clearError: () => void
  completeAdminAuth: (tokens: AuthTokenResponse) => void
  setAuth: (authData: { user: AuthUser; token: string; expiresAt: string }) => void
  refreshToken: () => Promise<boolean>
  /** refresh 결과 종류까지 돌려준다 — transient(5xx·네트워크)는 로그아웃 근거가 아니다 */
  refreshSession: () => Promise<'ok' | 'invalid' | 'transient'>
  checkSessionExpiry: () => boolean
  /** unreachable 안내 [다시 시도] — 같은 잠금으로 refresh를 다시 시도한다 */
  retryBootstrapRestore: () => Promise<void>
  /** unreachable 안내 [닫기] — refresh 수단은 지우지 않고 로그인 화면으로 보낸다 */
  dismissBootstrapUnreachable: () => void
  clearBootstrapNotice: () => void
}

export type BootstrapNotice = 'session-ended' | 'unreachable'

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

/**
 * QA-0137 저장 정책 (로그인·MFA·refresh·로그아웃 공통)
 * - access token: 메모리(`useAuthStore.token`)에만 둔다. localStorage에 쓰지 않는다.
 * - refresh 수단: `refresh-credential` (전환기 본문 refreshToken 또는 HttpOnly 쿠키 세션 표시).
 * - 만료 시각·사용자 정보: 기존처럼 localStorage (토큰 아님). 사용자 정보는 다른 탭 로그인·로그아웃 감지에도 쓴다.
 */
function persistSessionMeta(user: AuthUser, expiresAt: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(AUTH_EXPIRY_KEY, expiresAt)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
  recordTokenIssuedAt()
}

function clearStoredSession(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(AUTH_EXPIRY_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
  }
  removeLegacyStoredAccessToken()
  clearRefreshCredential()
  clearTokenIssuedAt()
}

function readStoredUserText(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return localStorage.getItem(AUTH_USER_KEY)
}

/**
 * 부트 시 상태. access token은 저장하지 않으므로 항상 null로 시작하고,
 * 저장된 사용자 + refresh 수단이 있으면 AuthProvider의 checkAuth가 refresh로 토큰을 다시 받는다.
 */
const loadAuthFromStorage = (): Partial<AuthState> & { canRestore: boolean } => {
  removeLegacyStoredAccessToken()
  const userStr = readStoredUserText()
  return {
    user: null,
    token: null,
    expiresAt: null,
    isAuthenticated: false,
    canRestore: Boolean(userStr) && hasRefreshCredential(),
  }
}

const initialState = loadAuthFromStorage()

/** 복원할 세션이 있으면 refresh 결과 전까지 보호 화면을 그리지 않는다. */
const initialIsBootstrapping = initialState.canRestore

/**
 * 새로고침 전 로그인 상태(저장된 사용자 + refresh 수단)였을 때 첫 checkAuth 한 번만 복원 안내 대상이다.
 * 비로그인·명시적 로그아웃·다른 탭 로그아웃/로그인으로 부른 checkAuth는 안내를 띄우지 않는다.
 */
let reloadRestorePending = initialState.canRestore

function consumeReloadRestore(): boolean {
  const pending = reloadRestorePending
  reloadRestorePending = false
  return pending
}

type RestoreOutcome = { ok: true } | { ok: false; kind: RefreshFailureKind }

/**
 * 새로고침 복원 refresh — 요청은 중단하지 않는다(서버가 이미 rotate했을 수 있다).
 * silentRetry: 실제 실패(일시 오류) 응답을 받은 경우에만 0.5초 뒤 한 번 더 시도한다.
 */
async function refreshForReloadRestore(silentRetry: boolean): Promise<RestoreOutcome> {
  const first = await refreshAccessTokenSessionWithResult()
  if (first.ok || first.kind !== 'transient' || !silentRetry) return first
  await new Promise(resolve => setTimeout(resolve, BOOTSTRAP_REFRESH_RETRY_DELAY_MS))
  return refreshAccessTokenSessionWithResult()
}

/** 진행 중인 새로고침 복원 — [다시 시도]는 새 요청 없이 이 결과를 기다린다 */
let bootstrapRestoreInFlight: Promise<void> | null = null
/** 재시도 안내에서 [닫기]를 눌러 로그인 화면으로 간 상태 */
let bootstrapDismissed = false

/** 로그인 화면 `?redirect=` (보호 화면이 붙여 준 원래 경로) */
function hasLoginRedirectParam(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(new URLSearchParams(window.location.search).get('redirect'))
}

function parseStoredActiveUser(userStr: string | null): AuthUser | null {
  if (!userStr) return null
  try {
    const user = JSON.parse(userStr) as AuthUser
    return user?.isActive ? user : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  /**
   * 새로고침 복원 1회 실행 + 결과 처리. 이미 진행 중이면 같은 promise를 돌려준다 (refresh 중복 없음).
   * - 성공: 안내를 닫고 로그인을 이어 간다. [닫기] 뒤 늦게 성공하면 토큰만 반영하고,
   *   로그인 화면에 redirect가 있을 때만 로그인 상태로 바꿔 원래 경로로 보낸다(로그인 화면의 기존 이동 처리).
   * - 400·401·403: 로컬 로그아웃 + "로그인이 종료되었어요."
   * - 그 밖의 실패: 로그아웃하지 않고 재시도 안내 (닫은 뒤라면 아무것도 하지 않는다)
   */
  const runBootstrapRestore = (silentRetry: boolean): Promise<void> => {
    if (bootstrapRestoreInFlight) return bootstrapRestoreInFlight
    const userStr = readStoredUserText()
    const tokenAtStart = get().token
    const isCurrentLogin = () => readStoredUserText() === userStr

    bootstrapRestoreInFlight = (async () => {
      try {
        const outcome = await refreshForReloadRestore(silentRetry)
        if (!isCurrentLogin()) {
          // 기다리는 동안 다른 탭이 로그인·로그아웃했다 — 그 결과를 덮지 않는다
          set({ bootstrapNotice: null, bootstrapRetrying: false, isBootstrapping: false })
          return
        }
        if (outcome.ok) {
          const user = parseStoredActiveUser(userStr)
          const { token, expiresAt } = get()
          if (!user || !token) {
            get().logout()
            return
          }
          if (bootstrapDismissed && !hasLoginRedirectParam()) {
            set({ bootstrapRetrying: false })
            return
          }
          set({
            user,
            token,
            expiresAt,
            isAuthenticated: true,
            isBootstrapping: false,
            bootstrapNotice: null,
            bootstrapRetrying: false,
          })
          return
        }
        if (outcome.kind === 'session-invalid') {
          if (get().token !== tokenAtStart) return
          get().logout()
          set({ bootstrapNotice: 'session-ended' })
          return
        }
        if (bootstrapDismissed) {
          set({ bootstrapRetrying: false })
          return
        }
        set({ bootstrapNotice: 'unreachable', bootstrapRetrying: false })
      } finally {
        bootstrapRestoreInFlight = null
      }
    })()
    return bootstrapRestoreInFlight
  }

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
    bootstrapNotice: null,
    bootstrapRetrying: false,

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

        clearRefreshCredential()
        get().applyAuthSession({
          user: response.user,
          token: response.token,
          expiresAt: response.expiresAt,
        })
        set({ loading: false })
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
      // F5: 로그인 세대가 바뀌면 진행 중이던 이전 세션의 refresh 응답은 저장되지 않는다
      bumpAuthGeneration()

      const verifiedMfaState = state.mfaState ? { ...state.mfaState, isVerified: true } : null
      // QA-0137: 본문에 refreshToken이 없으면 undefined로 덮지 않고 HttpOnly 쿠키 세션으로 표시
      storeRefreshTokenFromResponse(tokens.refreshToken)
      get().applyAuthSession({
        user: state.user,
        token: tokens.accessToken,
        expiresAt: tokenExpiresAtFromResponse(tokens),
      })
      set({ mfaState: verifiedMfaState })
    },

    applyAuthSession: ({ user, token, expiresAt }) => {
      persistSessionMeta(user, expiresAt)
      clearSessionScopedQueryCaches()
      set({
        user,
        token,
        expiresAt,
        isAuthenticated: true,
        mfaState: null,
        requiresMfa: false,
        error: null,
        isBootstrapping: false,
        bootstrapNotice: null,
        bootstrapRetrying: false,
      })
    },

    setAuth: session => {
      // F5: 로그인 세대가 바뀌면 진행 중이던 이전 세션의 refresh 응답은 저장되지 않는다
      bumpAuthGeneration()
      get().applyAuthSession(session)
    },

    logout: options => {
      // F5: 로그인 세대가 바뀌면 진행 중이던 이전 세션의 refresh 응답은 저장되지 않는다
      bumpAuthGeneration()
      const skipRemote = options?.skipRemote === true
      const refreshToken =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
          : null

      // QA-0137: 저장 refreshToken·쿠키 세션 표시·실 JWT 중 하나라도 있으면 실 세션 (mock·MFA pending 제외)
      const hadRemoteSession =
        !skipRemote &&
        (Boolean(refreshToken) || hasRefreshCredential() || hasRemoteAdminJwt(get().token))

      // TODO(QA-0137 인프라 전환 후 삭제): 저장된 refreshToken이 사라지면 본문 logout 분기를 지운다.
      let remoteLogout: Promise<void> | undefined
      if (refreshToken && !skipRemote) {
        remoteLogout = fetchAdminAuthLogout({ refreshToken })
      }
      // QA-0137: HttpOnly refresh 쿠키 폐기·삭제. best effort — 실패해도 로컬 로그아웃은 그대로 진행한다.
      if (hadRemoteSession) {
        void fetchAdminAuthRefreshCookieLogout()
      }

      // 사용자 정보 삭제(storage 이벤트)로 다른 탭도 로그아웃을 감지한다 (use-session-timeout)
      clearStoredSession()

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
        bootstrapNotice: null,
        bootstrapRetrying: false,
      })

      if (remoteLogout) {
        void remoteLogout.catch(error => {
          console.warn('Remote logout failed:', error)
        })
      }
    },

    /**
     * 부트·다른 탭 로그인 시 세션 복원. 저장된 사용자 + refresh 수단으로 메모리 access token을 다시 받는다.
     * 기다리는 동안 다른 탭이 다른 계정으로 로그인·로그아웃했으면(저장된 사용자 변경) 그 결과를 덮지 않는다.
     */
    checkAuth: async () => {
      const state = get()
      if (state._isCheckingAuth && state._checkAuthPromise) {
        return state._checkAuthPromise
      }

      const userStr = readStoredUserText()
      if (!userStr) {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          expiresAt: null,
          isBootstrapping: false,
        })
        return
      }

      const isCurrentLogin = () => readStoredUserText() === userStr

      let keepBootstrapping = false
      const checkAuthPromise = (async () => {
        try {
          let storedUser: AuthUser | null = null
          try {
            storedUser = JSON.parse(userStr) as AuthUser
          } catch {
            storedUser = null
          }
          if (!storedUser?.isActive) {
            if (isCurrentLogin()) get().logout()
            return
          }

          const current = get()
          const needsRefresh =
            !current.token ||
            !current.expiresAt ||
            shouldRefreshAccessToken(new Date(current.expiresAt).getTime(), Date.now())

          if (needsRefresh) {
            if (!hasRefreshCredential()) {
              if (isCurrentLogin()) get().logout()
              return
            }
            const tokenAtStart = current.token
            if (consumeReloadRestore()) {
              // 결과 처리(로딩 해제·안내)는 runBootstrapRestore가 맡는다.
              keepBootstrapping = true
              const restore = runBootstrapRestore(true)
              // 3초 안에 끝나지 않으면 요청은 그대로 두고 로딩 화면 위에 재시도 안내를 먼저 띄운다
              const noticeTimer = setTimeout(() => {
                if (bootstrapRestoreInFlight && !bootstrapDismissed && isCurrentLogin()) {
                  set({ bootstrapNotice: 'unreachable' })
                }
              }, BOOTSTRAP_REFRESH_NOTICE_DELAY_MS)
              try {
                await restore
              } finally {
                clearTimeout(noticeTimer)
              }
              return
            } else {
              const refreshed = await get().refreshToken()
              if (!refreshed) {
                // 저장소의 refresh 수단은 다른 탭의 새 로그인 값일 수 있다 — 서버 logout으로 그 세션을 끊지 않고 로컬만 정리한다
                if (isCurrentLogin() && get().token === tokenAtStart) get().logout({ skipRemote: true })
                return
              }
            }
          }

          if (!isCurrentLogin()) return
          const { token, expiresAt } = get()
          if (!token) return
          set({ user: storedUser, token, expiresAt, isAuthenticated: true })
        } finally {
          set({
            _isCheckingAuth: false,
            _checkAuthPromise: null,
            ...(keepBootstrapping ? {} : { isBootstrapping: false }),
          })
        }
      })()

      set({ _isCheckingAuth: true, _checkAuthPromise: checkAuthPromise })
      return checkAuthPromise
    },

    clearError: () => set({ error: null }),

    refreshToken: async () => refreshAccessTokenSession(),

    refreshSession: async () => {
      // 실패 종류(session-invalid/transient)를 보존해, 일시 오류로 로그아웃하지 않게 한다
      const result = await refreshAccessTokenSessionWithResult()
      if (result.ok) return 'ok'
      return result.kind === 'transient' ? 'transient' : 'invalid'
    },

    retryBootstrapRestore: async () => {
      const state = get()
      if (state.bootstrapNotice !== 'unreachable' || state.bootstrapRetrying) return
      set({ bootstrapRetrying: true })
      // 진행 중인 refresh가 있으면 그 결과를 기다리고, 없을 때만 새로 1회 시도한다
      await runBootstrapRestore(false)
    },

    dismissBootstrapUnreachable: () => {
      // refresh 수단·저장된 사용자는 그대로 둔다 (다음 새로고침 때 다시 복원을 시도할 수 있다).
      // 진행 중인 refresh는 중단하지 않는다 — 늦게 성공하면 runBootstrapRestore가 처리한다.
      bootstrapDismissed = true
      set({
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
        isBootstrapping: false,
        bootstrapNotice: null,
        bootstrapRetrying: false,
      })
    },

    clearBootstrapNotice: () => set({ bootstrapNotice: null }),

    /**
     * 세션 keep-alive 점검 (AuthProvider가 60초마다 호출). 만료만 보고 바로 logout하지 않는다.
     * 1) access 만료 임박(30초 버퍼): refresh를 먼저 시도하고, 실패할 때만 logout.
     * 2) 아직 여유가 있어도, 사용자가 최근 30분 내 활동했고 마지막 발급 후 20분이 지났으면 선제 refresh.
     *    선제 refresh 실패는 logout하지 않는다.
     */
    checkSessionExpiry: (): boolean => {
      const state = get()
      const hasStorage = typeof window !== 'undefined' && !!window.localStorage
      // 이 탭의 메모리 access token 만료 시각 (localStorage 만료값은 다른 탭이 덮을 수 있다)
      const expiresAt = state.expiresAt
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
        .refreshSession()
        .then(outcome => {
          if (outcome === 'ok' || !nearExpiry) return
          // 5xx·네트워크·타임아웃은 세션 폐기의 근거가 아니다 — 다음 점검이나 요청의 401 처리에 맡긴다.
          if (outcome === 'transient') return
          const current = get()
          // Another tab or login may have rotated the session while this refresh
          // was in flight. Never revoke that replacement because of an old failure.
          const storedRefresh = hasStorage ? localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) : refreshAtRefreshStart
          if (current.isAuthenticated &&
              current.token === accessAtRefreshStart &&
              storedRefresh === refreshAtRefreshStart) {
            current.logout()
          }
        })
      return false
    },
  }
})
