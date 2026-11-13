/**
 * 인증 상태 관리 스토어
 * Phase 4.1.1: 사용자 인증 시스템
 */

import { create } from 'zustand'
import { readJwtSidClaim } from '@jakorea/domain/session'
import { bumpAuthGeneration } from '@/features/auth/lib/auth-generation'
import type { User, LoginRequest } from '@/types/user'
import type { MfaState } from '@/types/mfa'
import {
  CMS_REMOTE_SESSION_PREFIX,
  login as loginApi,
  validateToken,
  type LoginOptions,
} from '@/entities/user/api/auth-service'
import { updateMockUserById } from '@/entities/user/api/user-service'
import type { AuthTokenResponse } from '@/features/auth/model/admin-login-api.types'
import {
  fetchAdminAuthLogout,
  fetchAdminAuthRefreshCookieLogout,
} from '@/features/auth/api/admin-auth-fetcher'
import {
  AUTH_REFRESH_TOKEN_KEY,
  refreshAccessTokenSession,
  refreshAccessTokenSessionOutcome,
  type RefreshSessionOutcome,
} from '@/shared/instance/axios-instance'
import {
  RELOAD_RESTORE_NOTICE_DELAY_MS,
  RELOAD_RESTORE_SILENT_RETRY_DELAY_MS,
  SESSION_ENDED_NOTICE,
  markSessionEndedNotice,
} from '@/features/auth/lib/session-restore-notice'
import { cmsAlertModal, isCmsAlertModalReady } from '@/shared/ui/cms-alert-modal-api'
import {
  clearRefreshCredential,
  hasRefreshCredential,
  storeRefreshTokenFromResponse,
} from '@/features/auth/lib/refresh-credential'
import {
  readAccessTokenFromMemory,
  removeLegacyAccessTokenFromStorage,
  writeAccessTokenToMemory,
} from '@/features/auth/lib/access-token-memory'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { clearDashboardQueryCache } from '@/features/dashboard/api/clear-dashboard-query-cache'
import { clearDataManagementQueryCache } from '@/features/data-management/api/clear-data-management-query-cache'
import { clearLogsQueryCache } from '@/features/logs/api/clear-logs-query-cache'
import { clearPostsQueryCache } from '@/features/posts/api/clear-posts-query-cache'
import {
  clearSettlementQueryCache,
  discardAccountPaymentPlaintextCache,
} from '@/features/settlement-management/api/clear-settlement-query-cache'
import { clearMemberQueryCache } from '@/features/user/api/clear-member-query-cache'
import { clearPerformanceQueryCache } from '@/features/education-record/api/clear-performance-query-cache'
import { clearProgramQueryCache } from '@/features/program/shared/api/clear-query-cache'
import { clearNotificationsQueryCache } from '@/features/notifications/api/clear-query-cache'
import { flushSocialPendingLinks } from '@/features/auth/social-auth/flush-pending-links'
import { fetchAdminMe } from '@/features/auth/api/fetch-admin-me'
import { registerAdminSessionSyncPendingReader } from '@/features/auth/lib/admin-session-sync-state'
import {
  clearTokenIssuedAt,
  getLastUserActivityAt,
  readTokenIssuedAt,
  recordTokenIssuedAt,
  shouldProactivelyRefresh,
} from '@/features/auth/lib/session-keepalive'
import { applyAccessTokenRoleToSessionUser } from '@/features/auth/lib/admin-session-user'
import { applyAdminMeToSessionUser } from '@/features/auth/lib/apply-admin-me-to-session-user'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { withSessionAdminRole } from '@/shared/lib/admin-role-policy'
import {
  PASSWORD_CHANGE_REQUIRED_STORAGE_KEY,
  assignLoginAfterSessionEnd,
  isAdminFirstLoginOnboardingIncomplete,
  isCmsLoggedOutPublicPath,
} from '@/shared/utils/post-auth-redirect'

interface AuthState {
  user: Omit<User, 'password'> | null
  token: string | null
  expiresAt: string | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  mfaState: MfaState | null // Phase 0.5.1: MFA 상태
  requiresMfa: boolean // Phase 0.5.1: MFA 필요 여부
  /** MFA verify 등에서 내려온 임시 비밀번호 변경 필요 플래그 */
  passwordChangeRequired: boolean
  /** GET /api/admin/me 동기화 중 — 역할 가드 보류 */
  adminSessionSyncPending: boolean
  /** 부트 시 메모리에 access token이 없어 서버 갱신(refresh) 결과를 기다리는 중 */
  isBootstrapping: boolean
  /**
   * 새로고침 복원 refresh가 3초 안에 끝나지 않았거나 네트워크·서버 오류로 실패함 — 복원 로딩 화면 위 닫기·다시 시도.
   * 3초 초과는 화면 기준일 뿐 요청은 계속 기다린다.
   */
  restoreFailure: 'network' | null
  /** 새로고침 복원 [다시 시도] 진행 중 */
  restoreRetrying: boolean
  /** 새로고침 직후 저장된 사용자로 복원한 세션 — 첫 refresh 결과 안내 대상 (다른 탭 전환·직접 로그아웃 제외) */
  _reloadRestorePending: boolean
  /** 복원 안내에서 [닫기]로 로그인 화면에 감 — 진행 중 refresh가 늦게 성공하면 그때 세션을 적용한다 */
  _restoreLeftToLogin: boolean
  // Phase 2: checkAuth 중복 호출 방지를 위한 내부 상태
  _isCheckingAuth: boolean
  _checkAuthPromise: Promise<void> | null

  // Actions
  login: (
    request: LoginRequest,
    options?: LoginOptions
  ) => Promise<{ requiresMfa: boolean; mfaState?: MfaState } | void>
  /** `preserveReturnPath: false` — 사용자가 직접 로그아웃 (로그인 후 원래 화면 복귀 안 함) */
  /**
   * skipRemote: 서버 logout(본문·쿠키)을 보내지 않고 로컬만 정리한다.
   * 저장소의 refresh 수단이 다른 탭의 새 세션일 수 있는 경우(409 ROTATED 무효, 다른 계정 로그인 감지)에 쓴다.
   */
  logout: (options?: { preserveReturnPath?: boolean; skipRemote?: boolean }) => void
  /** silentRetry: 새로고침 복원 refresh가 네트워크·서버 오류면 한 번 조용히 다시 시도 (기본 true) */
  checkAuth: (options?: { silentRetry?: boolean }) => Promise<void>
  /** 새로고침 복원 안내의 [다시 시도] — 진행 중 refresh가 있으면 합류하고, 없으면 탭 간 잠금 아래 1회 시작 */
  retryReloadRestore: () => Promise<void>
  /** 새로고침 복원 실패 안내의 [닫기] — refresh 수단·저장된 사용자는 지우지 않고 로그인 화면으로 */
  leaveReloadRestoreToLogin: () => void
  updateUser: (userData: Partial<Omit<User, 'password'>>) => void
  clearError: () => void
  setMfaVerified: () => void // Phase 0.5.1: MFA 인증 완료 처리 (Mock TOTP)
  completeAdminAuth: (tokens: AuthTokenResponse) => void // 실 API MFA 검증 후 JWT 저장
  applySocialAuthTokens: (tokens: AuthTokenResponse) => void // 실 API 소셜 SSO 토큰 저장
  /** 소셜 로그인 session consume이 MFA challenge를 반환했을 때 비밀번호 로그인과 같은 MFA 모달 상태로 전환 */
  beginAdminMfaChallenge: (input: {
    challengeUuid: string
    mfaMethod?: string
    expiresAt?: string
    mfaSetupRequired?: boolean
  }) => void
  clearPasswordChangeRequired: () => void
  setAuth: (authData: { user: Omit<User, 'password'>; token: string; expiresAt: string }) => void // Phase 0.1.3: 인증 상태 직접 설정
  refreshToken: () => Promise<boolean> // Phase 0.5: 토큰 갱신 Mock 로직
  /** refresh 결과 종류까지 돌려준다 — transient(5xx·네트워크)는 로그아웃 근거가 아니다 */
  refreshSession: () => Promise<RefreshSessionOutcome>
  checkSessionExpiry: () => boolean // Phase 0.5: 세션 만료 확인
}

const TOKEN_EXPIRY_KEY = 'auth_expires_at'
const AUTH_USER_STORAGE_KEY = 'auth_user'

/** 만료 임박 판단 버퍼. 관리자 access TTL(1h)과 같은 고정 1h 임계값은 쓰지 않는다. */
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

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

/**
 * QA-0137 access token 저장 정책 — 로그인·MFA·소셜 로그인·refresh·mock 갱신이 모두 이 함수를 거친다.
 * 토큰 값은 메모리(스토어 상태)에만 두고, 브라우저 저장소에는 만료 시각·발급 시각만 남긴다.
 * 호출한 쪽이 같은 값으로 `token`·`expiresAt` 상태를 설정한다.
 */
function persistAccessTokenSession(expiresAt: string): void {
  if (hasLocalStorage()) {
    removeLegacyAccessTokenFromStorage()
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt)
  }
  // 다음 선제 refresh(발급 후 20분) 기준 시각 — 탭/새로고침 간 공유
  recordTokenIssuedAt()
}

function persistSessionUser(user: Omit<User, 'password'>): void {
  if (hasLocalStorage()) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
  }
}

/** axios refresh 응답 반영 — access token은 메모리에만 둔다 (`persistAccessTokenSession`) */
export function commitRefreshedAccessToken(accessToken: string, expiresAt: string): void {
  persistAccessTokenSession(expiresAt)
  useAuthStore.setState({ token: accessToken, expiresAt })
}

function persistAuthTokens(
  user: Omit<User, 'password'>,
  tokens: AuthTokenResponse
): { token: string; expiresAt: string } {
  const accessToken = tokens.accessToken
  const expiresAt = tokenExpiresAtFromResponse(tokens)

  persistAccessTokenSession(expiresAt)
  persistSessionUser(user)
  // QA-0137: 본문에 refreshToken이 없으면 undefined로 덮지 않고 HttpOnly 쿠키 세션으로 표시
  storeRefreshTokenFromResponse(tokens.refreshToken)

  return { token: accessToken, expiresAt }
}

/**
 * access token 없이 저장된 사용자만으로 세션을 복원할 수 있는지.
 * 실 API는 refresh 수단(저장된 refreshToken 또는 HttpOnly 쿠키 세션 표시)이 있어야 하고,
 * 백엔드 미설정(mock) 환경은 mock 갱신이 새 mock 토큰을 만든다.
 */
function canRestoreSessionWithoutAccessToken(): boolean {
  return hasRefreshCredential() || !isRealApiModuleEnabled('adminAuth')
}

// localStorage에서 사용자 정보만 복원한다. access token은 저장하지 않으므로 항상 null로 시작하고,
// AuthProvider 초기화(checkAuth)가 refresh로 다시 받는다 (실패하면 그때 logout).
// 순환 import(TDZ)를 피하려고 axios-instance 대신 import 없는 refresh-credential 헬퍼를 쓴다.
const loadAuthFromStorage = (): Partial<AuthState> => {
  const signedOut: Partial<AuthState> = {
    user: null,
    token: null,
    expiresAt: null,
    isAuthenticated: false,
    passwordChangeRequired: false,
  }
  if (!hasLocalStorage()) return signedOut

  // 이전 버전이 남긴 access token은 읽지 않고 지운다 (1회 이관)
  removeLegacyAccessTokenFromStorage()

  const userStr = localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (!userStr || !canRestoreSessionWithoutAccessToken()) return signedOut

  try {
    const normalizedUser = withSessionAdminRole(JSON.parse(userStr))
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(normalizedUser))
    return {
      user: normalizedUser,
      token: null,
      expiresAt: null,
      isAuthenticated: true,
      passwordChangeRequired: localStorage.getItem(PASSWORD_CHANGE_REQUIRED_STORAGE_KEY) === '1',
    }
  } catch {
    // JSON 파싱 실패 시 초기화
    return signedOut
  }
}

// 초기 상태를 즉시 로드
const initialState = loadAuthFromStorage()

/** 다음 logout 한 번만 로그인 화면 이동에 쓸 돌아올 경로 파라미터 (endSessionWithNotice 전용) */
let nextLogoutReturnParam: 'redirect' | undefined

/** 저장된 세션은 있지만 메모리에 access token이 없으면, refresh 결과 전까지 보호 화면을 그리지 않는다. */
const initialIsBootstrapping = !!initialState.isAuthenticated && !initialState.token

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
    passwordChangeRequired: initialState.passwordChangeRequired ?? false,
    adminSessionSyncPending: false,
    isBootstrapping: initialIsBootstrapping,
    restoreFailure: null,
    restoreRetrying: false,
    _reloadRestorePending: initialIsBootstrapping,
    _restoreLeftToLogin: false,
    _isCheckingAuth: false, // Phase 2: checkAuth 중복 호출 방지
    _checkAuthPromise: null, // Phase 2: checkAuth Promise 저장

    login: async (request: LoginRequest, options?: LoginOptions) => {
      set({ loading: true, error: null })

      try {
        const response = await loginApi(request, options)

        // MFA 필요 시 MFA 상태만 설정하고 인증은 완료하지 않음
        if (response.requiresMfa && response.mfaState) {
          const normalizedUser = withSessionAdminRole(response.user)
          set({
            user: normalizedUser,
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
        const normalizedUser = withSessionAdminRole(response.user)
        persistAccessTokenSession(response.expiresAt.toString())
        persistSessionUser(normalizedUser)

        set({
          user: normalizedUser,
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
        const token = `mock-jwt-token-${state.user.id}-${Date.now()}`
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        persistAccessTokenSession(expiresAt)
        persistSessionUser(state.user)

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

    completeAdminAuth: (tokens: AuthTokenResponse) => {
      const state = get()
      if (!state.user) return
      // F5: 로그인 세대가 바뀌면 진행 중이던 이전 세션의 refresh 응답은 저장되지 않는다
      bumpAuthGeneration()

      const normalizedUser = applyAccessTokenRoleToSessionUser(state.user, tokens.accessToken)
      const { token, expiresAt } = persistAuthTokens(normalizedUser, tokens)
      const passwordChangeRequired = tokens.passwordChangeRequired === true

      if (typeof window !== 'undefined' && window.localStorage) {
        if (passwordChangeRequired) {
          localStorage.setItem(PASSWORD_CHANGE_REQUIRED_STORAGE_KEY, '1')
        } else {
          localStorage.removeItem(PASSWORD_CHANGE_REQUIRED_STORAGE_KEY)
        }
      }

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
        passwordChangeRequired,
      })

      clearDashboardQueryCache()
      clearLogsQueryCache()
      clearDataManagementQueryCache()
      clearPostsQueryCache()
      clearSettlementQueryCache()
      clearMemberQueryCache()
      clearPerformanceQueryCache()
      clearProgramQueryCache()
      clearNotificationsQueryCache()
      void flushSocialPendingLinks()
      void refreshAdminSessionFromMe()
    },

    clearPasswordChangeRequired: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(PASSWORD_CHANGE_REQUIRED_STORAGE_KEY)
      }
      set({ passwordChangeRequired: false })
    },

    beginAdminMfaChallenge: input => {
      const placeholderUser: Omit<User, 'password'> = {
        id: 'social-sso-mfa-pending',
        email: 'admin@social-login.local',
        name: '관리자',
        role: 'ADMIN',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      }
      set({
        user: withSessionAdminRole(placeholderUser),
        token: null,
        expiresAt: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        requiresMfa: true,
        mfaState: {
          method: 'totp',
          isRequired: true,
          isVerified: false,
          accountLabel: '관리자',
          lastSentAt: null,
          failedAttempts: 0,
          isLocked: false,
          lockUntil: null,
          challengeUuid: input.challengeUuid,
          mfaMethod: input.mfaMethod,
          challengeExpiresAt: input.expiresAt,
          mfaSetupRequired: input.mfaSetupRequired,
        },
      })
    },

    applySocialAuthTokens: (tokens: AuthTokenResponse) => {
      // F5: 로그인 세대가 바뀌면 진행 중이던 이전 세션의 refresh 응답은 저장되지 않는다
      bumpAuthGeneration()
      const placeholderUser: Omit<User, 'password'> = {
        id: 'social-sso-pending',
        email: '',
        name: '관리자',
        role: 'ADMIN',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      }
      const normalizedUser = applyAccessTokenRoleToSessionUser(placeholderUser, tokens.accessToken)
      const { token, expiresAt } = persistAuthTokens(normalizedUser, tokens)

      set({
        user: normalizedUser,
        token,
        expiresAt,
        isAuthenticated: true,
        loading: false,
        error: null,
        mfaState: null,
        requiresMfa: false,
      })

      clearDashboardQueryCache()
      clearLogsQueryCache()
      clearDataManagementQueryCache()
      clearPostsQueryCache()
      clearSettlementQueryCache()
      clearMemberQueryCache()
      clearPerformanceQueryCache()
      clearProgramQueryCache()
      clearNotificationsQueryCache()
      void flushSocialPendingLinks()
      void refreshAdminSessionFromMe()
    },

    logout: options => {
      // F5: 로그인 세대가 바뀌면 진행 중이던 이전 세션의 refresh 응답은 저장되지 않는다
      bumpAuthGeneration()
      const refreshToken =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
          : null

      const hadSession = Boolean(refreshToken) || hasRefreshCredential() || Boolean(get().token)

      // Authorization 없이 refreshToken body만으로 서버 세션 무효화 (로컬 clear 전에 요청 시작)
      // TODO(QA-0137 인프라 전환 후 삭제): 저장된 refreshToken이 사라지면 본문 logout 분기를 지운다.
      let remoteLogout: Promise<void> | undefined
      const remoteAllowed = isRealApiModuleEnabled('adminAuth') && options?.skipRemote !== true
      if (remoteAllowed && refreshToken) {
        remoteLogout = fetchAdminAuthLogout({ refreshToken })
      }
      // QA-0137: HttpOnly refresh 쿠키 폐기·삭제. best effort — 실패해도 로컬 로그아웃은 그대로 진행한다.
      if (remoteAllowed && hadSession) {
        void fetchAdminAuthRefreshCookieLogout()
      }

      // 다른 탭은 auth_user 삭제(storage 이벤트)로 로그아웃을 알아챈다 (use-session-timeout)
      removeLegacyAccessTokenFromStorage()
      if (hasLocalStorage()) {
        localStorage.removeItem(TOKEN_EXPIRY_KEY)
        localStorage.removeItem(AUTH_USER_STORAGE_KEY)
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
        localStorage.removeItem(PASSWORD_CHANGE_REQUIRED_STORAGE_KEY)
      }
      clearRefreshCredential()
      clearTokenIssuedAt()
      set({
        passwordChangeRequired: false,
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
        error: null,
        mfaState: null,
        requiresMfa: false,
        adminSessionSyncPending: false,
        isBootstrapping: false,
        restoreFailure: null,
        restoreRetrying: false,
        _reloadRestorePending: false,
        _restoreLeftToLogin: false,
        _isCheckingAuth: false,
        _checkAuthPromise: null,
      })

      if (remoteLogout) {
        void remoteLogout.catch(error => {
          console.warn('Remote logout failed:', error)
        })
      }

      clearDashboardQueryCache()
      clearLogsQueryCache()
      clearDataManagementQueryCache()
      clearPostsQueryCache()
      clearSettlementQueryCache()
      clearMemberQueryCache()
      clearPerformanceQueryCache()
      clearProgramQueryCache()
      clearNotificationsQueryCache()
      // 새로고침 복원 ① 안내는 로그인 화면의 기존 `redirect` 파라미터로 원래 화면을 넘긴다 (한 번만)
      const returnParam = nextLogoutReturnParam
      nextLogoutReturnParam = undefined
      if (options?.preserveReturnPath === false) {
        assignLoginAfterSessionEnd({ preserveReturnPath: false })
      } else {
        assignLoginAfterSessionEnd(returnParam ? { returnParam } : undefined)
      }
    },

    checkAuth: async (options?: { silentRetry?: boolean }) => {
      const state = get()
      // 중복 호출 방지: 이미 체크 중이면 기존 Promise 반환
      if (state._isCheckingAuth && state._checkAuthPromise) {
        return state._checkAuthPromise
      }

      if (!hasLocalStorage()) {
        set({ isAuthenticated: false, user: null, isBootstrapping: false })
        return
      }

      // access token은 메모리에만 있다. 새로고침 직후에는 null이고 refresh로 다시 받는다 (QA-0137).
      let token = state.token
      let expiresAt = state.expiresAt
      const userStr = localStorage.getItem(AUTH_USER_STORAGE_KEY)
      const tokenAtStart = token
      // 같은 로그인인지: 저장된 사용자가 그대로이고, 메모리 토큰이 기대한 값(또는 같은 sid로 갱신된 값)인지
      const isSameLoginToken = (expected: string | null) => {
        const current = get().token
        if (current === expected) return true
        const expectedSid = readJwtSidClaim(expected)
        return Boolean(expectedSid) && readJwtSidClaim(current) === expectedSid
      }
      const isStoredUserUnchanged = () => localStorage.getItem(AUTH_USER_STORAGE_KEY) === userStr
      const isCurrentLogin = () => Boolean(token) && isStoredUserUnchanged() && isSameLoginToken(token)

      if (!userStr || (!token && !canRestoreSessionWithoutAccessToken())) {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          expiresAt: null,
          isBootstrapping: false,
        })
        return
      }

      // 새로고침 직후 복원(실 API)만 실패 종류별로 안내한다. 다른 탭 전환·선제 갱신은 기존 동작.
      const isReloadRestore =
        !tokenAtStart && state._reloadRestorePending && isRealApiModuleEnabled('adminAuth')
      let keepBootstrapping = false

      const checkAuthPromise = (async () => {
        try {
          // 메모리에 토큰이 없거나(새로고침) access 만료 임박(30초 버퍼)일 때만 refresh.
          // TTL 1h와 같은 고정 1h 선제 갱신은 하지 않는다.
          if (!token || !expiresAt ||
              shouldRefreshAccessToken(new Date(expiresAt).getTime(), Date.now())) {
            if (isReloadRestore) {
              const outcome = await restoreAccessTokenAfterReload({
                silentRetry: options?.silentRetry !== false,
                // 3초 안에 끝나지 않으면 ② 안내만 띄우고 요청은 계속 기다린다
                onSlow: () => {
                  const current = get()
                  if (current.isBootstrapping && !current._restoreLeftToLogin) {
                    set({ restoreFailure: 'network' })
                  }
                },
              })
              const leftToLogin = get()._restoreLeftToLogin
              if (outcome === 'transient') {
                // ② 로그아웃하지 않는다. 복원 로딩 화면을 유지한 채 닫기·다시 시도 안내.
                // [닫기]로 이미 로그인 화면에 갔으면 refresh 수단을 그대로 두고 아무것도 하지 않는다.
                if (!leftToLogin && isStoredUserUnchanged() && !get().token) {
                  keepBootstrapping = true
                  set({ restoreFailure: 'network' })
                } else if (leftToLogin) {
                  set({ _reloadRestorePending: false, _restoreLeftToLogin: false })
                }
                return
              }
              if (outcome !== 'ok') {
                if (isStoredUserUnchanged() && isSameLoginToken(tokenAtStart)) {
                  // ① 서버가 refresh를 거절(400·401·403) — 로그인 화면에서 안내.
                  // refresh 수단이 그 사이 사라졌으면(다른 탭 로그아웃 등) 안내 없이 로그아웃만 한다.
                  if (outcome === 'invalid') endSessionWithNotice(get().logout)
                  else get().logout()
                }
                return
              }
              // 늦게 성공하면 안내를 닫고 이어간다. [닫기] 뒤라도 같은 저장 사용자면 아래에서 세션을 적용한다.
              set({ _reloadRestorePending: false, _restoreLeftToLogin: false, restoreFailure: null })
            } else {
              const refreshed = await get().refreshToken()
              if (!refreshed) {
                if (isStoredUserUnchanged() && isSameLoginToken(tokenAtStart)) get().logout()
                return
              }
            }
            token = get().token
            expiresAt = get().expiresAt
            if (!token || !expiresAt) {
              if (!get().token) get().logout()
              return
            }
            if (!isCurrentLogin()) return
          }

          // localStorage에 저장된 사용자 정보로 먼저 확인
          let storedUser: Omit<User, 'password'> | null = null
          try {
            storedUser = JSON.parse(userStr)
          } catch {
            // JSON 파싱 실패 시 validateToken 호출
          }

          let user: Omit<User, 'password'> | null = null
          try {
            user = await validateToken(token)
          } catch (error) {
            console.warn('Token validation failed, using stored user:', error)
            if (storedUser && storedUser.isActive) {
              user = storedUser
            }
          }

          if (!isCurrentLogin()) return
          const commitSessionUser = (sessionUser: Omit<User, 'password'>) => {
            const normalizedUser = withSessionAdminRole(sessionUser)
            localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(normalizedUser))
            // 토큰은 이미 스토어에 있다. 같은 sid로 그 사이 갱신된 토큰을 이전 값으로 되돌리지 않는다.
            set({
              user: normalizedUser,
              isAuthenticated: true,
            })
          }

          if (user && user.isActive) {
            commitSessionUser(user)
          } else if (storedUser && storedUser.isActive) {
            commitSessionUser(storedUser)
          } else {
            console.warn('User not found or inactive, logging out')
            if (isCurrentLogin()) get().logout()
            return
          }

          await refreshAdminSessionFromMe()
        } catch (error) {
          console.error('Unexpected error in checkAuth:', error)
          if (!isCurrentLogin()) return
          try {
            const storedUser = JSON.parse(userStr)
            if (storedUser && storedUser.isActive) {
              const normalizedStoredUser = withSessionAdminRole(storedUser)
              localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(normalizedStoredUser))
              set({
                user: normalizedStoredUser,
                isAuthenticated: true,
              })
              await refreshAdminSessionFromMe()
            } else {
              if (isCurrentLogin()) get().logout()
            }
          } catch {
            if (isCurrentLogin()) get().logout()
          }
        } finally {
          set({
            _isCheckingAuth: false,
            _checkAuthPromise: null,
            isBootstrapping: keepBootstrapping,
          })
        }
      })()

      set({ _isCheckingAuth: true, _checkAuthPromise: checkAuthPromise })
      return checkAuthPromise
    },

    retryReloadRestore: async () => {
      const state = get()
      if (state.restoreFailure !== 'network' || state.restoreRetrying) return
      set({ restoreRetrying: true })
      try {
        // 진행 중인 복원이 있으면 checkAuth가 그 Promise를 돌려준다(합류). 없으면 조용한 재시도 없이 1회 시작.
        await get().checkAuth({ silentRetry: false })
      } finally {
        set({ restoreRetrying: false })
      }
    },

    leaveReloadRestoreToLogin: () => {
      // refresh 수단(refreshToken·쿠키 세션 표시)과 auth_user는 지우지 않는다 — 다음 새로고침에서 다시 복원한다.
      // 진행 중인 refresh는 끊지 않는다(이미 rotate됐을 수 있음). 늦게 성공하면 그때 세션을 적용한다.
      const inFlight = get()._isCheckingAuth
      set({
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
        isBootstrapping: false,
        restoreFailure: null,
        restoreRetrying: false,
        _reloadRestorePending: inFlight,
        _restoreLeftToLogin: inFlight,
      })
    },

    updateUser: (userData: Partial<Omit<User, 'password'>>) => {
      const currentUser = get().user
      if (!currentUser) return

      const updatedUser = { ...currentUser, ...userData }
      if (updatedUser.id !== currentUser.id || updatedUser.roleCode !== currentUser.roleCode) {
        discardAccountPaymentPlaintextCache()
      }

      // Mock 데이터 동기화 (validateToken/login과 동일 데이터 소스 유지)
      updateMockUserById(currentUser.id, userData as Partial<User>)

      // localStorage 업데이트
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser))
      }

      set({ user: updatedUser })
    },

    clearError: () => {
      set({ error: null })
    },

    // Phase 0.1.3: 인증 상태 직접 설정 (휴대폰/소셜 로그인용)
    setAuth: (authData: { user: Omit<User, 'password'>; token: string; expiresAt: string }) => {
      // F5: 로그인 세대가 바뀌면 진행 중이던 이전 세션의 refresh 응답은 저장되지 않는다
      bumpAuthGeneration()
      const normalizedUser = withSessionAdminRole(authData.user)
      persistAccessTokenSession(authData.expiresAt)
      persistSessionUser(normalizedUser)

      set({
        user: normalizedUser,
        token: authData.token,
        expiresAt: authData.expiresAt,
        isAuthenticated: true,
        loading: false,
        error: null,
        mfaState: null,
        requiresMfa: false,
      })
      void flushSocialPendingLinks()
    },

    // Phase 0.5: 토큰 갱신 — adminAuth 실 API는 axios single-flight와 동일 경로
    refreshToken: async (): Promise<boolean> => {
      const state = get()
      if (!state.user) {
        return false
      }

      if (isRealApiModuleEnabled('adminAuth')) {
        // 성공하면 axios-instance가 commitRefreshedAccessToken으로 메모리 토큰을 바꿔 둔다
        return refreshAccessTokenSession()
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 300))

        // mock: 새로고침으로 메모리 토큰이 없으면 저장된 사용자로 새 mock 토큰을 만든다
        const newToken = state.token?.startsWith(CMS_REMOTE_SESSION_PREFIX)
          ? `${CMS_REMOTE_SESSION_PREFIX}${state.user.id}-${Date.now()}`
          : `mock-jwt-token-${state.user.id}-${Date.now()}`
        const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        persistAccessTokenSession(newExpiresAt)

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

    refreshSession: async (): Promise<RefreshSessionOutcome> => {
      if (!get().user) return 'no-credential'
      if (isRealApiModuleEnabled('adminAuth')) {
        // 실패 종류(invalid/transient)를 보존해, 일시 오류로 로그아웃하지 않게 한다
        return refreshAccessTokenSessionOutcome()
      }
      return (await get().refreshToken()) ? 'ok' : 'invalid'
    },

    /**
     * 세션 keep-alive 점검 (AuthProvider가 60초마다 호출). 만료만 보고 바로 logout하지 않는다.
     * 1) access 만료 임박(30초 버퍼): refresh를 먼저 시도하고, 실패할 때만 logout.
     *    (활동이 없어 BE idle 30분을 넘긴 세션은 BE가 거절 → 여기서 logout)
     * 2) 아직 여유가 있어도, 사용자가 최근 30분 내 활동했고 마지막 발급 후 20분이 지났으면 선제 refresh.
     *    선제 refresh 실패는 logout하지 않는다 (access가 아직 유효하므로 다음 tick/401 처리에 맡김).
     * 만료 시각은 이 탭 메모리의 access token 기준이다 (다른 탭 토큰은 이 탭이 쓰지 않는다).
     * 동기 API라 refresh는 fire-and-forget. 반환값: 이 호출에서 즉시 logout했으면 true.
     */
    checkSessionExpiry: (): boolean => {
      const state = get()
      const hasStorage = hasLocalStorage()
      const expiresAt = state.expiresAt
      if (!expiresAt) {
        return true // 만료된 것으로 간주
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

/**
 * 새로고침 복원 refresh.
 * - 3초 안에 끝나지 않으면 onSlow로 안내만 띄우고 요청은 끊지 않는다 (끊고 다시 보내면 rotate된 값 재사용으로 세션 폐기).
 * - 실제 실패(transient)일 때만 silentRetry면 0.5초 뒤 한 번 조용히 다시 시도한다. 두 요청이 동시에 나가지 않는다.
 */
async function restoreAccessTokenAfterReload(options: {
  silentRetry: boolean
  onSlow: () => void
}): Promise<RefreshSessionOutcome> {
  const slowTimer = setTimeout(options.onSlow, RELOAD_RESTORE_NOTICE_DELAY_MS)
  try {
    const first = await refreshAccessTokenSessionOutcome()
    if (first !== 'transient' || !options.silentRetry) return first
    await new Promise(resolve => setTimeout(resolve, RELOAD_RESTORE_SILENT_RETRY_DELAY_MS))
    return await refreshAccessTokenSessionOutcome()
  } finally {
    clearTimeout(slowTimer)
  }
}

/**
 * ① 세션 종료 안내 + 로그아웃.
 * 보호 화면이면 로그아웃이 로그인 화면으로 전체 이동하므로 표시를 남겨 로그인 화면이 띄운다.
 * 이미 로그인 화면 등 공개 화면이면([닫기] 뒤 늦은 거절) 이동이 없으니 바로 띄운다.
 */
function endSessionWithNotice(logout: () => void): void {
  const onPublicPage =
    typeof window !== 'undefined' && isCmsLoggedOutPublicPath(window.location.pathname)
  if (!onPublicPage) {
    markSessionEndedNotice()
    nextLogoutReturnParam = 'redirect'
  }
  logout()
  nextLogoutReturnParam = undefined
  if (onPublicPage && isCmsAlertModalReady()) {
    cmsAlertModal.show({ title: SESSION_ENDED_NOTICE.title, content: SESSION_ENDED_NOTICE.content })
  }
}

export async function refreshAdminSessionFromMe(): Promise<void> {
  if (!isRealApiModuleEnabled('adminAuth')) return
  if (isAdminFirstLoginOnboardingIncomplete()) return
  if (!hasRemoteAdminJwt()) return

  useAuthStore.setState({ adminSessionSyncPending: true })
  try {
    const me = await fetchAdminMe()
    const current = useAuthStore.getState().user
    if (!current) return
    const next = applyAdminMeToSessionUser(current, me)
    if (next.id !== current.id || next.roleCode !== current.roleCode) {
      discardAccountPaymentPlaintextCache()
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(next))
    }
    useAuthStore.setState({ user: next })
  } catch (error) {
    console.warn('[auth] GET /api/admin/me failed:', error)
  } finally {
    useAuthStore.setState({ adminSessionSyncPending: false })
  }
}

// QA-0137: access token 메모리 보관소는 스토어 상태만 따른다 (axios·auth-service·소셜 로그인이 읽는다)
writeAccessTokenToMemory(useAuthStore.getState().token)
useAuthStore.subscribe(state => {
  if (readAccessTokenFromMemory() !== state.token) writeAccessTokenToMemory(state.token)
})

registerAdminSessionSyncPendingReader(
  () => useAuthStore.getState().adminSessionSyncPending === true,
)
