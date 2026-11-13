/**
 * Platform(Vite)용 Axios 클라이언트.
 * - Base URL: `VITE_API_BASE_URL` (미설정 + DEV 프록시 시 동일 출처 상대 경로)
 * - 인증: access token은 메모리(`getAccessToken`, 브라우저 저장소에 쓰지 않음) + `withCredentials`.
 *   새로고침·새 탭은 첫 렌더 전에 `bootstrapPortalAccessToken`으로 다른 탭에서 받거나 refresh한다 (QA-0137).
 * - 리프레시: `POST /api/portal/auth/refresh` (no Bearer). QA-0137 전환기: 저장된 refreshToken이 있으면 본문으로 보내고
 *   HttpOnly 쿠키(`JA_MEMBER_RT`)도 실리도록 인증 호출은 `withCredentials`를 명시한다. 응답 본문에 refreshToken이 없으면
 *   쿠키 세션으로 전환해 본문 없이 refresh한다 (`setAuthTokens`·`hasRefreshCredential`).
 *
 * 인증 헤더 판정(`skipAuth`/공개 경로)과 401 자동 Refresh 판정(`skipRefresh`/제외 경로)은 분리한다.
 * - Activity: Bearer 부착 + 401 시 Refresh·재POST 0회
 * - Session GET: Bearer 부착 + 401 시 Access JWT 자체가 만료된 경우에만 Refresh 1회 → 재조회 1회
 * - Refresh: 탭 내 single-flight + 탭 간 Web Locks 직렬화. 409 REFRESH_TOKEN_ALREADY_ROTATED는 재POST 금지
 * - 인증 실패 처리: 세대·저장 토큰 비교로 오래된 실패가 새 세션을 서버 Logout/삭제하지 못하게 한다
 */

import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type HeadersDefaults,
  type InternalAxiosRequestConfig,
} from 'axios'
import { portalAuthPaths } from '@/features/auth/sign-in/api/endpoints'
import { getApiBaseUrl, getApiBaseUrlForPath } from '@/shared/lib/api-remote-env'
import { isAdminOnboardingRequired } from '@/shared/lib/admin-onboarding-session'
import { readJwtExpiresAtMs } from '@jakorea/domain/session'
import { requestAccessTokenFromPeers } from '@/shared/lib/access-token-memory'
import {
  bootstrapAccessToken,
  retryAccessTokenRestore,
  type AuthBootstrapDeps,
  type AuthBootstrapResult,
} from '@/shared/lib/auth-bootstrap'
import { showAuthRestoreNotice } from '@/shared/lib/auth-restore-notice'
import { getServerCorrectedNowMs } from '@/shared/lib/server-clock'
import {
  getAccessToken,
  getAuthGeneration,
  getRefreshToken,
  hasRefreshCredential,
  setAuthTokens,
} from '@/shared/lib/auth-token'

export type TAxiosHeaders = {
  'Content-Type': string
  Accept: string
  Authorization?: string
  'ngrok-skip-browser-warning'?: string
}

export type TErrorResponse = {
  success?: boolean
  data?: unknown
  message?: string
  error?: {
    code?: string
    message?: string
  }
  code?: number
}

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  /** 요청 시점 탭 인증 세대 (request interceptor가 기록) */
  _authGeneration?: number
  skipRefresh?: boolean
  skipAuth?: boolean
  /** verification-sessions 등 skipAuth 경로여도 Bearer를 유지한다. */
  forceAuth?: boolean
}

const HOMEPAGE_AUTH_PREFIX = '/api/homepage/auth'
const PORTAL_AUTH_PREFIX = '/api/portal/auth'
const PORTAL_ORGANIZATIONS_SCHOOLS = '/api/portal/organizations/schools'
const PORTAL_PUBLIC_SURVEYS_PREFIX = '/api/portal/public/surveys/'
const AUTH_VERIFICATION_SESSIONS_PREFIX = '/api/auth/verification-sessions'
const DEFAULT_REFRESH_PATH = `${PORTAL_AUTH_PREFIX}/refresh`
const PORTAL_SESSION_ACTIVITY_PATH = portalAuthPaths.activity()
const PORTAL_SESSION_STATUS_PATH = portalAuthPaths.session()
const REFRESH_TOKEN_ALREADY_ROTATED = 'REFRESH_TOKEN_ALREADY_ROTATED'
/** 탭 간 Refresh 직렬화 (Web Locks). 미지원 브라우저는 탭 내 single-flight만 적용 */
const CROSS_TAB_REFRESH_LOCK = 'platform:portal-auth-refresh'
/** 409 후 다른 탭이 저장할 최신 토큰을 기다리는 최대 시간 */
const ROTATED_TOKEN_WAIT_MS = 3_000
/** JWT exp 판정 여유 (클라이언트 시계 오차 흡수) */
const ACCESS_EXPIRY_HINT_SKEW_MS = 5_000
/** 새 탭 시작 시 열려 있는 다른 탭의 access token 응답을 기다리는 시간 */
const PEER_ACCESS_TOKEN_WAIT_MS = 200
/** 시작 시 복원이 네트워크·5xx로 실패했을 때 조용한 재시도 전 대기 */
const AUTH_RESTORE_RETRY_DELAY_MS = 500

export { getApiBaseUrl, isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

function getRefreshPath(): string {
  const fromEnv = import.meta.env.VITE_AUTH_REFRESH_PATH?.trim()
  const path = fromEnv || DEFAULT_REFRESH_PATH
  return path.startsWith('/') ? path : `/${path}`
}

function getLogoutPath(): string {
  return portalAuthPaths.logout()
}

/** QA-0137: 토큰 발급·갱신·폐기 호출은 HttpOnly refresh 쿠키가 오가도록 credentials를 명시한다 */
const AUTH_COOKIE_CREDENTIALS = { withCredentials: true } as const

function getErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const error = (data as TErrorResponse).error
  if (error && typeof error === 'object' && typeof error.code === 'string') {
    return error.code
  }
  return undefined
}

/** blob 다운로드 실패 본문이 JSON이면 기존 401/403 코드 분기가 동작하도록 복원합니다. 200 본문은 건드리지 않습니다. */
async function hydrateJsonFromBlobError(error: AxiosError<TErrorResponse>): Promise<void> {
  const response = error.response
  if (!response || error.config?.responseType !== 'blob') return
  const data: unknown = response.data
  if (typeof Blob === 'undefined' || !(data instanceof Blob)) return
  try {
    const text = (await data.text()).trim()
    if (!text.startsWith('{') && !text.startsWith('[')) return
    response.data = JSON.parse(text) as TErrorResponse
  } catch {
    // ZIP/HTML 등 JSON이 아니면 원본 Blob을 유지합니다.
  }
}

function resolveRequestUrl(config: InternalAxiosRequestConfig): string {
  const raw = `${config.baseURL ?? ''}${config.url ?? ''}`
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw).pathname
    }
  } catch {
    // fall through
  }
  return config.url ?? raw
}

function pathOf(url?: string): string {
  if (!url) return ''
  return url.split('?')[0] ?? url
}

/** 공개 인증 경로 — Authorization 헤더를 붙이지 않는다 (skipAuth와 동일 효과). */
function isPublicAuthPath(url?: string): boolean {
  const path = pathOf(url)
  if (!path) return false
  return (
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/login`) ||
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/refresh`) ||
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/logout`) ||
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/signup`) ||
    path.includes(`${PORTAL_AUTH_PREFIX}/login`) ||
    path.includes(`${PORTAL_AUTH_PREFIX}/refresh`) ||
    path.includes(`${PORTAL_AUTH_PREFIX}/logout`) ||
    path.includes(`${PORTAL_AUTH_PREFIX}/signup`) ||
    path.includes(`${PORTAL_AUTH_PREFIX}/email/check`) ||
    path.includes(`${PORTAL_AUTH_PREFIX}/password-reset`) ||
    path.includes(PORTAL_ORGANIZATIONS_SCHOOLS) ||
    path.includes(PORTAL_PUBLIC_SURVEYS_PREFIX) ||
    path.includes(AUTH_VERIFICATION_SESSIONS_PREFIX)
  )
}

function isPortalSessionActivityPath(url?: string): boolean {
  return pathOf(url).endsWith(PORTAL_SESSION_ACTIVITY_PATH)
}

function isPortalSessionStatusPath(url?: string): boolean {
  return pathOf(url).endsWith(PORTAL_SESSION_STATUS_PATH)
}

/**
 * 401 자동 Refresh 제외 경로. 공개 인증 경로 + Activity(Bearer는 유지).
 * Activity 401은 Refresh·재POST 없이 호출자에게 그대로 전달한다.
 */
function isExcludedFromAutoRefresh(url?: string): boolean {
  return isPublicAuthPath(url) || isPortalSessionActivityPath(url)
}

function readBearerToken(headers: InternalAxiosRequestConfig['headers'] | undefined): string | null {
  if (!headers) return null
  const raw =
    typeof (headers as AxiosRequestHeaders).get === 'function'
      ? (headers as AxiosRequestHeaders).get('Authorization')
      : (headers as Record<string, unknown>).Authorization
  if (typeof raw !== 'string') return null
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim())
  return match?.[1]?.trim() || null
}

/**
 * 요청 제어 힌트: JWT exp가 지났으면 true. 판독 불가면 false(만료로 단정하지 않음).
 * 현재 시각은 세션 응답 `serverNow`로 보정한 서버 기준 시각을 쓴다(보정값이 없으면 PC 시계).
 */
function isAccessTokenExpiredByHint(
  accessToken: string | null,
  nowMs = getServerCorrectedNowMs(),
): boolean {
  const expMs = readJwtExpiresAtMs(accessToken)
  return expMs != null && expMs <= nowMs + ACCESS_EXPIRY_HINT_SKEW_MS
}

function clearAuthorizationHeader(
  headers: InternalAxiosRequestConfig['headers'] | undefined,
): InternalAxiosRequestConfig['headers'] {
  const next = (headers ?? {}) as AxiosRequestHeaders
  if (typeof next.delete === 'function') {
    next.delete('Authorization')
  } else {
    delete (next as Record<string, unknown>).Authorization
  }
  return next
}

function setAuthorizationHeader(
  headers: InternalAxiosRequestConfig['headers'] | undefined,
  token: string,
): InternalAxiosRequestConfig['headers'] {
  const next = (headers ?? {}) as AxiosRequestHeaders
  if (typeof next.set === 'function') {
    next.set('Authorization', `Bearer ${token}`)
  } else {
    ;(next as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return next
}

const timeout = 30_000

const axiosClient = axios.create({
  baseURL: getApiBaseUrl() || undefined,
  timeout,
  withCredentials: true,
})

axiosClient.defaults.headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'X-Client': 'web',
  ...(import.meta.env.VITE_NGROK_SKIP_BROWSER_WARNING
    ? { 'ngrok-skip-browser-warning': import.meta.env.VITE_NGROK_SKIP_BROWSER_WARNING }
    : {}),
} as TAxiosHeaders & AxiosRequestHeaders & HeadersDefaults & { 'X-Client': 'web' }

/**
 * POST refresh. refreshToken이 있으면 본문(전환기), null이면 본문 없이 HttpOnly 쿠키로 갱신한다.
 * TODO(QA-0137 인프라 전환 후 삭제): 본문 분기를 지우고 항상 본문 없이 보낸다.
 */
export async function postAuthenticationRefreshToken(refreshToken: string | null) {
  const path = getRefreshPath()
  return axiosClient.post<unknown>(
    path,
    refreshToken ? { refreshToken } : undefined,
    {
      ...AUTH_COOKIE_CREDENTIALS,
      skipRefresh: true,
      skipAuth: true,
    } as RetryableRequest,
  )
}

/** POST /api/portal/auth/logout — body refreshToken only, expects 204 */
export async function postPortalAuthLogout(refreshToken: string): Promise<void> {
  await axiosClient.post(
    getLogoutPath(),
    { refreshToken },
    {
      ...AUTH_COOKIE_CREDENTIALS,
      skipRefresh: true,
      skipAuth: true,
      validateStatus: (status: number) => status === 204 || status === 200,
    } as unknown as RetryableRequest,
  )
}

/**
 * POST /api/portal/auth/refresh/logout — HttpOnly refresh 쿠키의 토큰 폐기·쿠키 삭제 (QA-0137). 본문 없음.
 * best effort: 쿠키가 없거나(전환 전·로컬) 실패해도 던지지 않는다 — 로컬 로그아웃을 막지 않는다.
 */
export async function postPortalAuthRefreshCookieLogout(): Promise<void> {
  try {
    await axiosClient.post(portalAuthPaths.refreshLogout(), undefined, {
      ...AUTH_COOKIE_CREDENTIALS,
      skipRefresh: true,
      skipAuth: true,
      validateStatus: (status: number) => status === 204 || status === 200,
    } as unknown as RetryableRequest)
  } catch {
    // 쿠키 폐기 실패는 무시한다.
  }
}

/** @deprecated `postPortalAuthLogout` 사용 */
export const postHomepageAuthLogout = postPortalAuthLogout

let refreshPromise: Promise<string> | null = null

class PortalRefreshError extends Error {
  /** 서버가 인증 무효를 확정했는지 (401/400/403). 네트워크·5xx는 false */
  readonly definitive: boolean
  /** 서버 Logout에 이 토큰을 써도 되는지 (409 stale 경쟁이면 false) */
  readonly allowServerLogout: boolean
  readonly refreshTokenUsed: string | null
  readonly originalError: unknown

  constructor(input: {
    message: string
    definitive: boolean
    allowServerLogout: boolean
    refreshTokenUsed: string | null
    originalError?: unknown
  }) {
    super(input.message)
    this.name = 'PortalRefreshError'
    this.definitive = input.definitive
    this.allowServerLogout = input.allowServerLogout
    this.refreshTokenUsed = input.refreshTokenUsed
    this.originalError = input.originalError
  }
}

function parseAccessTokenFromRefreshBody(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.length > 0) {
    return payload
  }
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data && typeof o.data === 'object') {
      return parseAccessTokenFromRefreshBody(o.data)
    }
    for (const key of ['accessToken', 'token'] as const) {
      const v = o[key]
      if (typeof v === 'string' && v.length > 0) return v
    }
  }
  return null
}

function parseRefreshTokenFromRefreshBody(payload: unknown): string | null {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data && typeof o.data === 'object') {
      return parseRefreshTokenFromRefreshBody(o.data)
    }
    const v = o.refreshToken
    if (typeof v === 'string' && v.length > 0) return v
  }
  return null
}

function parseExpiresInFromRefreshBody(payload: unknown): number | undefined {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data && typeof o.data === 'object') {
      return parseExpiresInFromRefreshBody(o.data)
    }
    if (typeof o.expiresInSeconds === 'number') return o.expiresInSeconds
  }
  return undefined
}

type AuthFailureContext = {
  /** 실패를 유발한 요청/Refresh 시점의 탭 인증 세대 */
  generation: number
  /** 실패를 유발한 Refresh 토큰 (없으면 null) */
  refreshToken: string | null
  /** 서버 Logout 시도 여부. 409 경쟁처럼 토큰 유효성이 불분명하면 false */
  serverLogout: boolean
}

/** 같은 세대에 대해 실패 처리를 한 번만 수행한다. 새 로그인(세대 증가) 시 자연히 초기화된다. */
let authFailureHandledGeneration: number | null = null

function isStaleAuthFailure(ctx: AuthFailureContext): boolean {
  // 이 탭에서 이미 새 로그인·Refresh·로그아웃이 일어났다.
  if (ctx.generation !== getAuthGeneration()) return true
  // 다른 탭이 최신 토큰으로 교체(Refresh 회전 또는 새 로그인)했다.
  if (getRefreshToken() !== ctx.refreshToken) return true
  return false
}

async function handleAuthFailure(ctx: AuthFailureContext, options: { redirect?: boolean } = {}) {
  const onAdminRegisteredOnboarding =
    isAdminOnboardingRequired() &&
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/auth/admin-registered')

  if (onAdminRegisteredOnboarding) return
  if (isStaleAuthFailure(ctx)) return
  if (authFailureHandledGeneration === ctx.generation) return
  authFailureHandledGeneration = ctx.generation

  const path =
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'
  const { logoutPortalSession } = await import('@/features/auth/session/portal-logout')
  await logoutPortalSession({
    serverLogout: ctx.serverLogout,
    refreshToken: ctx.refreshToken,
    // 시작 시 복원 실패는 이동하지 않는다 — 로그인이 필요한 화면은 각 가드가 비로그인으로 처리한다.
    redirectTo:
      options.redirect === false ? null : `/auth/sign-in?redirect=${encodeURIComponent(path)}`,
  })
}

/**
 * 409 경쟁에서 승자 탭의 저장을 기다린다. 전환기는 refreshToken 변경, 쿠키 세션(previous=null)은 access 변경으로 판정.
 * access token은 메모리에 있으므로 다른 탭의 교체는 BroadcastChannel로 이 탭 메모리에 반영된 값으로 본다.
 */
function waitForStoredRefreshTokenChange(
  previous: string | null,
  previousAccessToken: string | null,
  timeoutMs: number,
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  return new Promise(resolve => {
    const startedAt = Date.now()
    const check = () => {
      const current = getRefreshToken()
      if (current && current !== previous) {
        resolve(true)
        return
      }
      const currentAccess = getAccessToken()
      if (previous == null && currentAccess && currentAccess !== previousAccessToken) {
        resolve(true)
        return
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false)
        return
      }
      window.setTimeout(check, 150)
    }
    check()
  })
}

function withCrossTabRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { locks?: LockManager }).locks
      : undefined
  if (!locks || typeof locks.request !== 'function') return task()
  return locks.request(CROSS_TAB_REFRESH_LOCK, { mode: 'exclusive' }, task) as Promise<T>
}

/**
 * Refresh 1회. 탭 간 lock 안에서 저장소를 다시 읽어, 다른 탭이 이미 회전했으면 POST 없이 최신 Access를 쓴다.
 * 409 REFRESH_TOKEN_ALREADY_ROTATED는 같은 토큰으로 재POST하지 않고 최신 저장 토큰만 확인한다.
 */
async function refreshAccessTokenOnce(
  failedAccessToken: string | null,
  options: RefreshOptions = {},
): Promise<string> {
  return withCrossTabRefreshLock(async () => {
    // lock을 잡은 뒤 다시 읽는다 — 앞선 탭이 회전한 refreshToken·쿠키·access token을 이어받는다.
    const storedAccessToken = getAccessToken()
    const storedRefreshToken = getRefreshToken()

    if (storedAccessToken && failedAccessToken && storedAccessToken !== failedAccessToken) {
      // 다른 탭(또는 이 탭의 앞선 Refresh)이 이미 교체했다. 회전된 토큰을 다시 쓰지 않는다.
      return storedAccessToken
    }
    if (storedAccessToken && options.reuseCurrentAccessToken) {
      // 시작 시 복원: lock 대기 중 다른 탭이 받은 토큰을 이 탭에 알려 줬다.
      return storedAccessToken
    }
    // QA-0137: 저장된 refreshToken이 없어도 쿠키 세션 표시가 있으면 본문 없이 쿠키로 refresh한다.
    if (!storedRefreshToken && !hasRefreshCredential()) {
      throw new PortalRefreshError({
        message: 'No refresh token',
        definitive: true,
        allowServerLogout: false,
        refreshTokenUsed: null,
      })
    }

    let res
    try {
      res = await postAuthenticationRefreshToken(storedRefreshToken)
    } catch (err) {
      const axiosErr = err as AxiosError<TErrorResponse>
      const status = axiosErr.response?.status
      const code = getErrorCode(axiosErr.response?.data)

      if (status === 409 && code === REFRESH_TOKEN_ALREADY_ROTATED) {
        // 동시 회전 경쟁: 승자가 저장할 최신 토큰을 확인한다. 같은 토큰 재POST 금지.
        const rotated = await waitForStoredRefreshTokenChange(
          storedRefreshToken,
          storedAccessToken,
          ROTATED_TOKEN_WAIT_MS,
        )
        const latestAccessToken = getAccessToken()
        if (rotated && latestAccessToken) return latestAccessToken
        throw new PortalRefreshError({
          message: 'Refresh token already rotated',
          definitive: true,
          // 이 토큰은 이미 회전됐다. 이것으로 서버 Logout하면 같은 sid 후속 토큰까지 폐기된다.
          allowServerLogout: false,
          refreshTokenUsed: storedRefreshToken,
          originalError: err,
        })
      }

      const definitive = status === 400 || status === 401 || status === 403
      throw new PortalRefreshError({
        message: `Refresh failed (${status ?? 'network'})`,
        definitive,
        allowServerLogout: definitive,
        refreshTokenUsed: storedRefreshToken,
        originalError: err,
      })
    }

    const newAccessToken = parseAccessTokenFromRefreshBody(res.data)
    const newRefreshToken = parseRefreshTokenFromRefreshBody(res.data)
    const expiresInSeconds = parseExpiresInFromRefreshBody(res.data)

    // QA-0137: refreshToken은 전환기에만 본문에 온다. 없으면 setAuthTokens가 쿠키 세션으로 전환한다.
    if (!newAccessToken) {
      throw new PortalRefreshError({
        message: 'Invalid refresh response: missing access token',
        definitive: false,
        allowServerLogout: false,
        refreshTokenUsed: storedRefreshToken,
      })
    }

    // 회전 직후 다른 경로(로그아웃·새 로그인)가 저장소를 바꿨다면 덮어쓰지 않는다.
    // 쿠키 세션은 refreshToken 저장값이 없으므로 access 저장값으로도 비교한다.
    if (
      getRefreshToken() !== storedRefreshToken ||
      (!storedRefreshToken && getAccessToken() !== storedAccessToken)
    ) {
      const latestAccessToken = getAccessToken()
      if (latestAccessToken) return latestAccessToken
      throw new PortalRefreshError({
        message: 'Session changed during refresh',
        definitive: false,
        allowServerLogout: false,
        refreshTokenUsed: storedRefreshToken,
      })
    }

    const expiresAtIso =
      expiresInSeconds && expiresInSeconds > 0
        ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
        : undefined

    setAuthTokens({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAtIso,
    })

    return newAccessToken
  })
}

type RefreshOptions = {
  /** 시작 시 복원 — 메모리에 이미 토큰이 있으면 POST하지 않는다 */
  reuseCurrentAccessToken?: boolean
}

/** 탭 내 single-flight. 동시 401 요청은 같은 Refresh 결과를 공유한다. */
function runSingleFlightRefresh(
  failedAccessToken: string | null,
  options?: RefreshOptions,
): Promise<string> {
  if (refreshPromise) return refreshPromise
  refreshPromise = refreshAccessTokenOnce(failedAccessToken, options).finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

let bootstrapPromise: Promise<AuthBootstrapResult> | null = null

function createAuthRestoreDeps(): AuthBootstrapDeps {
  const generation = getAuthGeneration()
  return {
    getAccessToken,
    hasRefreshCredential,
    requestPeerAccessToken: () => requestAccessTokenFromPeers(PEER_ACCESS_TOKEN_WAIT_MS),
    // 탭 내 single-flight + 탭 간 lock. lock 대기 중 다른 탭이 알려 준 토큰이 있으면 POST하지 않는다.
    refresh: () => runSingleFlightRefresh(null, { reuseCurrentAccessToken: true }),
    classifyFailure: error =>
      error instanceof PortalRefreshError && error.definitive ? 'session-invalid' : 'unavailable',
    onSessionInvalid: error => {
      const refreshError = error as PortalRefreshError
      return handleAuthFailure(
        {
          generation,
          refreshToken: refreshError.refreshTokenUsed,
          serverLogout: refreshError.allowServerLogout,
        },
        { redirect: false },
      )
    },
    retryDelayMs: AUTH_RESTORE_RETRY_DELAY_MS,
  }
}

function applyAuthRestoreResult(result: AuthBootstrapResult): AuthBootstrapResult {
  if (result.notice) showAuthRestoreNotice(result.notice)
  return result
}

/**
 * 새로고침·새 탭 시작 시 메모리 access token 복원 (QA-0137). 앱 첫 렌더 전에 한 번 호출한다.
 * refresh 수단이 있으면 다른 탭에서 받거나 refresh한다.
 * - 서버가 세션 무효를 확정하면 기존 로그아웃 경로로 로컬 세션을 정리하고(이동 없음) '로그인 종료' 안내를 띄운다.
 * - 네트워크·5xx·timeout이면 로그아웃하지 않고 조용히 1회 재시도, 그래도 실패하면 '확인 못 함' 안내를 띄운다.
 * 렌더 대기 시간을 넘겨 늦게 끝나도 같은 규칙으로 처리한다(늦게 성공하면 조용히 복원).
 */
export function bootstrapPortalAccessToken(): Promise<AuthBootstrapResult> {
  if (bootstrapPromise) return bootstrapPromise
  bootstrapPromise = bootstrapAccessToken(createAuthRestoreDeps()).then(applyAuthRestoreResult)
  return bootstrapPromise
}

/** 안내 모달 [다시 시도] — 탭 간 lock 안에서 refresh 1회. 성공하면 setAuthTokens가 안내를 닫는다 */
export function retryPortalAccessTokenRestore(): Promise<AuthBootstrapResult> {
  return retryAccessTokenRestore(createAuthRestoreDeps()).then(applyAuthRestoreResult)
}

axiosClient.interceptors.request.use(
  config => {
    const retryable = config as RetryableRequest
    config.baseURL = getApiBaseUrlForPath(config.url ?? '')
    const url = resolveRequestUrl(config)
    retryable._authGeneration = getAuthGeneration()

    if (retryable.forceAuth) {
      const token = getAccessToken()
      if (token) {
        config.headers = setAuthorizationHeader(config.headers, token)
      }
      return config
    }

    // 인증 헤더 제거는 skipAuth/공개 경로만. skipRefresh(예: Activity)는 Bearer를 유지한다.
    if (retryable.skipAuth || isPublicAuthPath(url)) {
      config.headers = clearAuthorizationHeader(config.headers)
      return config
    }

    const token = getAccessToken()
    if (token) {
      config.headers = setAuthorizationHeader(config.headers, token)
    }
    return config
  },
  error => Promise.reject(error),
)

axiosClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<TErrorResponse>) => {
    await hydrateJsonFromBlobError(error)
    const { response, config } = error

    if (!response || !config) {
      return Promise.reject(error)
    }

    const originalRequest = config as RetryableRequest
    const requestUrl = resolveRequestUrl(originalRequest)
    const status = response.status
    const code = getErrorCode(response.data)

    if (
      originalRequest.skipRefresh ||
      (isExcludedFromAutoRefresh(requestUrl) && !originalRequest.forceAuth)
    ) {
      return Promise.reject(error)
    }

    // 403(ADMIN JWT로 MEMBER 세션 API 호출 등)은 Refresh로 우회하지 않는다.
    if (status === 403 && code === 'PERMISSION_DENIED') {
      return Promise.reject(error)
    }

    const isAccessTokenFailure = status === 401 && code === 'UNAUTHORIZED'
    if (!isAccessTokenFailure || originalRequest._retry) {
      return Promise.reject(error)
    }

    const failedAccessToken = readBearerToken(originalRequest.headers)

    // Session GET: Access JWT 자체 만료일 때만 Refresh 1회 + 재조회 1회.
    // sid 폐기·레거시(sid 없음)·서명 오류 401은 Refresh하지 않고 호출자가 재로그인으로 처리한다.
    if (
      isPortalSessionStatusPath(requestUrl) &&
      !isAccessTokenExpiredByHint(failedAccessToken)
    ) {
      return Promise.reject(error)
    }

    const generation = originalRequest._authGeneration ?? getAuthGeneration()
    originalRequest._retry = true

    try {
      const newAccessToken = await runSingleFlightRefresh(failedAccessToken)
      originalRequest.headers = setAuthorizationHeader(originalRequest.headers, newAccessToken)
      return axiosClient(originalRequest)
    } catch (err) {
      if (err instanceof PortalRefreshError && err.definitive) {
        void handleAuthFailure({
          generation,
          refreshToken: err.refreshTokenUsed,
          serverLogout: err.allowServerLogout,
        })
      }
      // 네트워크·5xx·잘못된 응답은 인증 폐기의 증거가 아니므로 로그아웃하지 않는다.
      return Promise.reject(err instanceof PortalRefreshError && err.originalError ? err.originalError : err)
    }
  },
)

export default axiosClient
export { axiosClient }
