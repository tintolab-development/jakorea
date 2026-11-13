/**
 * CMS(Vite)용 Axios 클라이언트.
 * - Base URL: `VITE_API_BASE_URL` (미설정 시 동일 출처 상대 경로).
 *   원격 백엔드를 ngrok으로 노출할 때는 **오리진만** 넣습니다. 예:
 *   `https://xxxx.ngrok-free.app` (끝에 `/api` 붙이지 않음 — 경로는 각 요청·`getRefreshPath`에서 합침).
 * - ngrok 무료 호스트의 브라우저 경고 페이지를 피하려면 `VITE_NGROK_SKIP_BROWSER_WARNING` 설정.
 * - 인증: `useAuthStore` 토큰 + `withCredentials`(쿠키 기반 세션과 병행 가능).
 *   access token은 메모리(스토어)에만 둔다 — 브라우저 저장소에 쓰지 않는다 (QA-0137, `features/auth/lib/access-token-memory`).
 * - 리프레시: `POST /api/admin/auth/refresh` (no Bearer). QA-0137 전환기: 저장된 refreshToken이 있으면 본문으로 보내고,
 *   HttpOnly 쿠키(`JA_ADMIN_RT`)도 함께 실리도록 인증 호출은 `withCredentials`를 명시한다.
 *   응답 본문에 refreshToken이 없으면 쿠키 세션으로 전환한다 (`features/auth/lib/refresh-credential`).
 *   OpenAPI: `RefreshTokenRequest` → `AuthTokenResponse` (access/refresh?/expiresInSeconds).
 */

import { commitRefreshedAccessToken, useAuthStore } from '@/features/auth/model/auth-store'
import { hasPasswordChangeRequiredComplete } from '@/features/auth/password-change-required/wizard-state'
import {
  passwordChangeRequiredPaths,
  resolveSessionAuthFailureRedirect,
} from '@/shared/utils/post-auth-redirect'
import {
  expiresAtIsoFromExpiresInSeconds,
  isAccessTokenUnauthorizedCode,
  parseAuthTokenResponse,
} from '@/features/auth/lib/parse-auth-token-response'
import {
  buildRefreshRequestBody,
  hasRefreshCredential,
  readStoredRefreshToken,
  storeRefreshTokenFromResponse,
} from '@/features/auth/lib/refresh-credential'
import { readJwtSidClaim } from '@jakorea/domain/session'
import { getAuthGeneration, SessionChangedDuringRefreshError } from '@/features/auth/lib/auth-generation'
import {
  confirmSessionEnded,
  isSessionEndConfirmPending,
} from '@/features/auth/lib/session-ended-confirm'
import { recordBackendErrorForE2e } from '@/features/e2e-error-log/lib/record-from-axios-error'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import { isRequestCanceledError } from '@/shared/lib/is-request-canceled-error'
import { showGlobalApiErrorAlert } from '@/shared/lib/show-global-api-error-alert'
import { adminAuthPaths } from '@/shared/config/api-paths'
import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type HeadersDefaults,
  type InternalAxiosRequestConfig,
} from 'axios'

/** 백엔드에서 리프레시 토큰을 내려줄 때 저장용 */
export const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token'

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

export type TApiErrorMessage = Record<number, string>

export type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipRefresh?: boolean
  skipAuth?: boolean
  /** true면 axios 글로벌 에러 AlertModal을 띄우지 않음 (호출부에서 직접 처리) */
  skipGlobalErrorAlert?: boolean
}

export { getApiBaseUrl, isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

function getRefreshPath(): string {
  return adminAuthPaths.refresh()
}

function getErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const error = (data as TErrorResponse).error
  if (error && typeof error === 'object' && typeof error.code === 'string') {
    return error.code
  }
  return undefined
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

function isExcludedFromBearerAuth(url?: string): boolean {
  if (!url) return false
  const path = url.split('?')[0] ?? url
  const prefix = adminAuthPaths.prefix
  return (
    path.includes(`${prefix}/login`) ||
    path.includes(`${prefix}/refresh`) ||
    path.includes(`${prefix}/logout`) ||
    path.includes(`${prefix}/mfa/`) ||
    path.includes(`${prefix}/signup`) ||
    path.includes(`${prefix}/sso/`)
  )
}

/** Activity requires Bearer but must not trigger an automatic refresh on 401. */
function isExcludedFromAutoRefresh(url?: string): boolean {
  if (!url) return false
  const path = url.split('?')[0] ?? url
  return isExcludedFromBearerAuth(url) || path === `${adminAuthPaths.prefix}/activity`
}

/**
 * 늦게 도착한 401(이 탭이 이미 refresh로 토큰을 바꾼 뒤)을 새 토큰으로 1회 재시도해도 되는지.
 * 같은 로그인 세션(sid)일 때만 허용한다 — 다른 계정으로 바뀐 뒤 이전 요청이 새 계정으로 실행되면 안 된다.
 */
function shouldRetryWithNewerAccessToken(
  request: RetryableRequest,
  requestUrl: string,
  code: string | undefined,
  sentBearer: string,
  activeToken: string | null,
): boolean {
  if (!activeToken || request._retry || request.skipRefresh) return false
  if (isExcludedFromAutoRefresh(requestUrl) || !isAccessTokenUnauthorizedCode(code)) return false
  const sentSid = readJwtSidClaim(sentBearer.slice('Bearer '.length))
  return sentSid != null && sentSid === readJwtSidClaim(activeToken)
}

/** refresh/logout 실패는 세션 핸들러·로그인 UI가 담당 — 글로벌 Alert 억제 */
function isSessionAuthUtilityPath(url?: string): boolean {
  if (!url) return false
  const path = url.split('?')[0] ?? url
  const prefix = adminAuthPaths.prefix
  return path.includes(`${prefix}/refresh`) || path.includes(`${prefix}/logout`)
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
 * POST refresh. 저장된 refreshToken이 있으면 본문(전환기), 없으면 본문 없이 HttpOnly 쿠키로 갱신한다.
 * 실패 코드는 그대로 `REFRESH_TOKEN_INVALID`.
 */
export async function postAuthenticationRefreshToken(refreshToken: string | null) {
  const path = getRefreshPath()
  return axiosClient.post<unknown>(path, buildRefreshRequestBody(refreshToken), {
    skipRefresh: true,
    skipAuth: true,
    skipGlobalErrorAlert: true,
    // QA-0137: 인증 호출은 refresh 쿠키가 오가도록 명시 (클라이언트 기본값과 무관하게 유지)
    withCredentials: true,
  } as RetryableRequest)
}

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let failedQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

function processQueue(token: string | null, error: unknown = null) {
  failedQueue.forEach(p => {
    if (token) {
      p.resolve(token)
    } else {
      p.reject(error)
    }
  })
  failedQueue = []
}

function readRefreshToken(): string | null {
  return readStoredRefreshToken()
}

/** refresh 수단을 저장소로 판단할 수 있는 환경인지 (저장소가 없으면 시작 시 값을 그대로 쓴다) */
function isRefreshStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

/** access token은 auth-store 저장 정책(메모리 전용)으로만 반영한다 */
function persistAccessToken(accessToken: string, expiresAtIso?: string) {
  const expires = expiresAtIso ?? expiresAtIsoFromExpiresInSeconds(undefined)
  commitRefreshedAccessToken(accessToken, expires)
}

/** 본문 refreshToken이 없으면(쿠키 전용 운영) 저장값을 undefined로 덮지 않고 쿠키 세션으로 전환한다 */
function persistRefreshToken(refreshToken: string | undefined) {
  storeRefreshTokenFromResponse(refreshToken)
}

/**
 * 세션 무효 확정 — 지금 화면에서 「로그인이 종료되었어요.」를 띄우고 [확인](또는 닫기) 때 로그아웃·이동한다.
 * 여러 요청이 동시에 와도 안내와 로그아웃은 한 번만 한다 (session-ended-confirm).
 */
function handleAuthFailure(options?: { skipRemote?: boolean }) {
  confirmSessionEnded(() => logoutAfterAuthFailure(options))
}

function logoutAfterAuthFailure(options?: { skipRemote?: boolean }) {
  const complete =
    typeof window !== 'undefined' ? hasPasswordChangeRequiredComplete() : false
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const search = typeof window !== 'undefined' ? window.location.search : ''

  useAuthStore.getState().logout(options?.skipRemote ? { skipRemote: true } : undefined)
  if (typeof window === 'undefined') return

  const target = resolveSessionAuthFailureRedirect({
    pathname,
    search,
    complete,
  })
  if (target == null) return
  if (target === passwordChangeRequiredPaths.complete && pathname === target) return
  window.location.assign(target)
}

function enqueueWhileRefreshing(originalRequest: RetryableRequest) {
  return new Promise((resolve, reject) => {
    failedQueue.push({
      resolve: (token: string) => {
        originalRequest._retry = true
        originalRequest.headers = setAuthorizationHeader(originalRequest.headers, token)
        resolve(axiosClient(originalRequest))
      },
      reject: err => {
        reject(err)
      },
    })
  })
}

const REFRESH_LOCK_NAME = 'jakorea-admin-refresh'

async function postRefreshAndPersist(refreshToken: string | null, generation: number): Promise<string> {
  const res = await postAuthenticationRefreshToken(refreshToken)
  const parsed = parseAuthTokenResponse(res.data)
  if (!parsed) {
    throw new Error('Invalid refresh response: missing access token')
  }
  // F5: 응답을 기다리는 사이 로그아웃·다른 로그인이 있었으면 저장하지 않는다 (로그아웃 뒤 세션이 되살아나지 않게)
  if (getAuthGeneration() !== generation) throw new SessionChangedDuringRefreshError()

  persistAccessToken(parsed.accessToken, expiresAtIsoFromExpiresInSeconds(parsed.expiresInSeconds))
  persistRefreshToken(parsed.refreshToken)

  return parsed.accessToken
}

/**
 * 잠금 안에서 최신 refresh 수단으로 갱신한다.
 * access token은 탭 메모리에만 있으므로 다른 탭의 결과를 채택하지 않고, 이 탭도 직접 refresh한다.
 * refresh token은 매번 rotate되므로 잠금을 기다린 뒤 저장소의 최신 값(또는 브라우저가 실어 보내는 최신 쿠키)을 쓴다.
 */
async function refreshWithLatestCredential(
  startedWithRefreshToken: string | null,
  generation: number,
): Promise<string> {
  // 잠금을 기다리는 사이 로그아웃·다른 로그인이 있었으면 refresh를 보내지 않는다
  if (getAuthGeneration() !== generation) throw new SessionChangedDuringRefreshError()
  // 저장값이 없으면(쿠키 세션) 본문 없이 쿠키로 요청한다.
  // 쿠키 세션에서 이 탭이 시작 때 쓰던 값을 다시 쓰지 않는다 — 다른 탭이 지운 rotate된 토큰일 수 있다.
  const storedRefreshToken = readRefreshToken()
  if (storedRefreshToken == null && !hasRefreshCredential() && isRefreshStorageAvailable()) {
    // 잠금을 기다리는 사이 다른 탭이 refresh 수단을 지웠다(로그아웃 등). 시작 때 값은 이미 rotate됐을 수 있어 보내지 않는다.
    throw new Error('Refresh credential was cleared while waiting for the refresh lock')
  }
  const tokenToUse = storedRefreshToken ?? (hasRefreshCredential() ? null : startedWithRefreshToken)
  try {
    return await postRefreshAndPersist(tokenToUse, generation)
  } catch (err) {
    // 락 미지원 환경 등에서 동시 refresh에 진 경우(409 REFRESH_TOKEN_ALREADY_ROTATED):
    // 승자가 rotate한 최신 refresh 수단으로 한 번만 다시 시도한다 (같은 값 재전송 금지).
    if (isRefreshAlreadyRotatedError(err)) {
      const latest = readRefreshToken()
      if (latest && latest !== tokenToUse) return postRefreshAndPersist(latest, generation)
      if (!latest && tokenToUse == null && hasRefreshCredential()) return postRefreshAndPersist(null, generation)
    }
    throw err
  }
}

/** 탭 간 refresh 직렬화 (Web Locks). 미지원 환경은 기존 동작(탭 내 single-flight만). */
async function refreshAcrossTabs(startedWithRefreshToken: string | null, generation: number): Promise<string> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  if (locks && typeof locks.request === 'function') {
    return await locks.request(REFRESH_LOCK_NAME, () =>
      refreshWithLatestCredential(startedWithRefreshToken, generation),
    )
  }
  return refreshWithLatestCredential(startedWithRefreshToken, generation)
}

/** refreshToken=null은 쿠키 세션(본문 없이 HttpOnly 쿠키로 refresh) */
async function runSingleFlightRefresh(refreshToken: string | null): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  const generation = getAuthGeneration()
  refreshPromise = (async () => {
    try {
      return await refreshAcrossTabs(refreshToken, generation)
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/** refresh 결과 — 새로고침 세션 복원이 실패 종류별로 안내를 나눈다 */
export type RefreshSessionOutcome = 'ok' | 'invalid' | 'transient' | 'no-credential'

/** 서버가 refresh 수단을 거절했다고 보는 상태 코드 — 이 셋만 세션 종료(invalid) */
const REFRESH_REJECTED_STATUSES = new Set([400, 401, 403])

/** 서버가 이미 rotate한 refresh token을 받았다는 409 코드 */
const REFRESH_TOKEN_ALREADY_ROTATED = 'REFRESH_TOKEN_ALREADY_ROTATED'

/** 409 REFRESH_TOKEN_ALREADY_ROTATED인지 (다른 409와 구분) */
function isRefreshAlreadyRotatedError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 409 &&
    getErrorCode(error.response?.data) === REFRESH_TOKEN_ALREADY_ROTATED
  )
}

/**
 * refresh 실패 분류.
 * - invalid: 400·401·403 — 서버가 refresh 수단을 거절했다.
 *   409 REFRESH_TOKEN_ALREADY_ROTATED도 invalid — 다시 보낼 새 값이 없어 여기까지 왔다(refreshWithLatestCredential이
 *   새 값이 있으면 이미 재시도함). 같은 값을 10초 뒤 다시 보내면 서버 재사용 탐지로 계정 전체 세션이 폐기되므로
 *   [다시 시도] 대상이 아니다.
 * - transient: 그 밖 전부(404·다른 409·기타 4xx·5xx·응답 없음·타임아웃·중단·응답 본문 이상) — 세션 종료의 근거가 아니다.
 */
export function classifyRefreshFailure(error: unknown): 'invalid' | 'transient' {
  if (!axios.isAxiosError(error)) return 'transient'
  const status = error.response?.status
  if (status === 409 && getErrorCode(error.response?.data) === REFRESH_TOKEN_ALREADY_ROTATED) {
    return 'invalid'
  }
  return status != null && REFRESH_REJECTED_STATUSES.has(status) ? 'invalid' : 'transient'
}

/**
 * 인터셉터와 같은 single-flight·탭 간 잠금으로 refresh하고 결과 종류를 돌려준다.
 * 진행 중인 refresh가 있으면 합류한다 (동시에 두 번 보내지 않는다).
 * 중간에 끊지 않는다 — 서버가 이미 rotate한 요청을 끊고 이전 값으로 다시 보내면 재사용 탐지로 세션 전체가 폐기된다.
 */
export async function refreshAccessTokenSessionOutcome(): Promise<RefreshSessionOutcome> {
  if (!hasRefreshCredential()) return 'no-credential'
  try {
    await runSingleFlightRefresh(readRefreshToken())
    return 'ok'
  } catch (error) {
    return classifyRefreshFailure(error)
  }
}

/**
 * 선제·수동 갱신용. 인터셉터와 동일 single-flight를 공유한다.
 * refresh 수단(저장된 refreshToken 또는 쿠키 세션 표시)이 없거나 실패하면 false.
 */
export async function refreshAccessTokenSession(): Promise<boolean> {
  return (await refreshAccessTokenSessionOutcome()) === 'ok'
}

axiosClient.interceptors.request.use(
  config => {
    const retryable = config as RetryableRequest
    const url = resolveRequestUrl(config)

    if (retryable.skipAuth || isExcludedFromBearerAuth(url)) {
      config.headers = clearAuthorizationHeader(config.headers)
      return config
    }

    const token = useAuthStore.getState().token
    if (token) {
      config.headers = setAuthorizationHeader(config.headers, token)
    }
    return config
  },
  error => Promise.reject(error)
)

axiosClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<TErrorResponse>) => {
    recordBackendErrorForE2e(error)

    const { response, config } = error

    if (!response || !config) {
      if (!isRequestCanceledError(error)) {
        showGlobalApiErrorAlert(error, config as RetryableRequest | undefined)
      }
      return Promise.reject(error)
    }

    const originalRequest = config as RetryableRequest
    const requestUrl = resolveRequestUrl(originalRequest)
    const status = response.status
    const code = getErrorCode(response.data)

    // A late 401 from an access token superseded by login/Refresh in this tab
    // must not refresh or revoke the newly active admin session.
    const sentBearer = originalRequest.headers?.get?.('Authorization')
    const activeToken = useAuthStore.getState().token
    if (status === 401 && typeof sentBearer === 'string' &&
        sentBearer.startsWith('Bearer ') &&
        sentBearer !== `Bearer ${activeToken ?? ''}`) {
      // 같은 로그인(sid)이 이미 refresh로 새 토큰을 받았으면 원 요청만 그 토큰으로 1회 다시 보낸다.
      // 로그아웃·다른 계정 로그인·자동 갱신 제외 경로(Activity 등)는 다시 보내지 않는다.
      if (shouldRetryWithNewerAccessToken(originalRequest, requestUrl, code, sentBearer, activeToken)) {
        originalRequest._retry = true
        originalRequest.headers = setAuthorizationHeader(originalRequest.headers, activeToken!)
        return axiosClient(originalRequest)
      }
      return Promise.reject(error)
    }

    if (originalRequest.skipRefresh || isExcludedFromAutoRefresh(requestUrl)) {
      if (!isSessionAuthUtilityPath(requestUrl) && !originalRequest.skipGlobalErrorAlert) {
        showGlobalApiErrorAlert(error, originalRequest)
      }
      return Promise.reject(error)
    }

    if (status === 403 && code === 'PERMISSION_DENIED') {
      showGlobalApiErrorAlert(error, originalRequest)
      return Promise.reject(error)
    }

    const isAccessTokenFailure = status === 401 && isAccessTokenUnauthorizedCode(code)
    if (isAccessTokenFailure && isSessionEndConfirmPending()) {
      // 세션 종료 안내가 떠 있는 동안에는 refresh를 다시 시도하지 않는다 (확인 시 로그아웃)
      return Promise.reject(error)
    }
    if (!isAccessTokenFailure || originalRequest._retry) {
      showGlobalApiErrorAlert(error, originalRequest)
      return Promise.reject(error)
    }

    const isSessionPath = requestUrl.includes(`${adminAuthPaths.prefix}/session`)
    if (isSessionPath && !readJwtSidClaim(useAuthStore.getState().token)) {
      handleAuthFailure()
      return Promise.reject(error)
    }

    if (!hasRefreshCredential()) {
      handleAuthFailure()
      return Promise.reject(error)
    }
    const refreshToken = readRefreshToken()

    if (isRefreshing) {
      return enqueueWhileRefreshing(originalRequest)
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newAccessToken = await runSingleFlightRefresh(refreshToken)
      processQueue(newAccessToken)
      isRefreshing = false

      originalRequest.headers = setAuthorizationHeader(originalRequest.headers, newAccessToken)
      return axiosClient(originalRequest)
    } catch (err) {
      processQueue(null, err)
      isRefreshing = false
      const sentBearer = originalRequest.headers?.get?.('Authorization')
      const currentToken = useAuthStore.getState().token
      const storedRefresh = readRefreshToken()
      const newerAccessToken = typeof sentBearer === 'string' &&
        sentBearer.startsWith('Bearer ') && sentBearer !== `Bearer ${currentToken ?? ''}`
      const rotatedInAnotherTab = Boolean(storedRefresh && storedRefresh !== refreshToken)
      if (newerAccessToken || rotatedInAnotherTab) {
        // A stale failed Refresh must not logout/revoke a newer access/refresh session.
        return Promise.reject(err)
      }
      if (classifyRefreshFailure(err) === 'transient') {
        // 5xx·네트워크·타임아웃은 세션 폐기의 근거가 아니다 — 로그아웃하지 않고 원 요청 실패로 돌려준다.
        if (axios.isAxiosError(err) && !isRequestCanceledError(err)) {
          showGlobalApiErrorAlert(err, originalRequest)
        }
        return Promise.reject(err)
      }
      // 409 ROTATED 무효: 저장소·쿠키에는 다른 탭이 회전한 새 세션이 있을 수 있다 — 서버 logout으로 그 세션을 끊지 않는다.
      handleAuthFailure(isRefreshAlreadyRotatedError(err) ? { skipRemote: true } : undefined)
      return Promise.reject(err)
    }
  }
)

export default axiosClient
export { axiosClient }
