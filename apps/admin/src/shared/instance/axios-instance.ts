/**
 * Homepage Admin Axios 클라이언트
 * - Bearer 토큰 부착
 * - 401 시 refresh single-flight
 * - 리프레시: `POST /api/admin/auth/refresh` (no Bearer). QA-0137 전환기: 저장된 refreshToken이 있으면 본문으로 보내고,
 *   HttpOnly 쿠키(`JA_ADMIN_RT`)도 함께 실리도록 인증 호출은 `withCredentials`를 명시한다.
 *   응답 본문에 refreshToken이 없으면 쿠키 세션으로 전환한다 (`features/auth/lib/refresh-credential`).
 * - access token은 메모리(`useAuthStore.token`)에만 둔다. 탭마다 따로 갖고, 여러 탭의 refresh는 Web Locks로 직렬화한다.
 */

import { readJwtSidClaim } from '@jakorea/domain/session'
import { isAccessTokenUnauthorizedCode } from '@/features/auth/lib/access-token-unauthorized-code'
import { recordTokenIssuedAt } from '@/features/auth/lib/session-keepalive'
import {
  buildRefreshRequestBody,
  hasRefreshCredential,
  readStoredRefreshToken,
  storeRefreshTokenFromResponse,
} from '@/features/auth/lib/refresh-credential'
import {
  classifyRefreshFailure,
  isRefreshAlreadyRotatedError,
  type RefreshSessionResult,
} from '@/features/auth/lib/refresh-failure'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { AUTH_EXPIRY_KEY, AUTH_REFRESH_TOKEN_KEY } from '@/features/auth/model/auth-storage'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { getApiBaseUrl, getApiBaseUrlForPath } from '@/shared/lib/api-remote-env'
import { buildLoginPathWithRedirect } from '@/shared/lib/login-redirect'
import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'

export { AUTH_REFRESH_TOKEN_KEY }

export type TErrorResponse = {
  success?: boolean
  data?: unknown
  message?: string
  error?: {
    code?: string
    message?: string
  }
  code?: number | string
}

export type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipRefresh?: boolean
  skipAuth?: boolean
}

function coerceJsonFromArrayBuffer(data: unknown): unknown {
  if (!(data instanceof ArrayBuffer) || data.byteLength < 2) return data
  try {
    const text = new TextDecoder('utf-8').decode(data).trim()
    if (!text.startsWith('{') && !text.startsWith('[')) return data
    return JSON.parse(text) as unknown
  } catch {
    return data
  }
}

function getErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as TErrorResponse
  if (record.error && typeof record.error === 'object' && typeof record.error.code === 'string') {
    return record.error.code
  }
  if (typeof record.code === 'string' && record.code.trim()) {
    return record.code
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
    path.includes(`${prefix}/mfa/`)
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

function clearAuthorizationHeader(
  headers: InternalAxiosRequestConfig['headers'] | undefined
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
  token: string
): InternalAxiosRequestConfig['headers'] {
  const next = (headers ?? {}) as AxiosRequestHeaders
  if (typeof next.set === 'function') {
    next.set('Authorization', `Bearer ${token}`)
  } else {
    ;(next as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return next
}

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const ngrokSkip = import.meta.env.VITE_NGROK_SKIP_BROWSER_WARNING?.trim()
if (ngrokSkip) {
  axiosInstance.defaults.headers.common['ngrok-skip-browser-warning'] = ngrokSkip
}

/**
 * POST refresh. 저장된 refreshToken이 있으면 본문(전환기), 없으면 본문 없이 HttpOnly 쿠키로 갱신한다.
 */
export async function postAuthenticationRefreshToken(refreshToken: string | null) {
  return axiosInstance.post<unknown>(
    adminAuthPaths.refresh(),
    buildRefreshRequestBody(refreshToken),
    {
      skipRefresh: true,
      skipAuth: true,
      // QA-0137: 인증 호출은 refresh 쿠키가 오가도록 명시 (클라이언트 기본값과 무관하게 유지)
      withCredentials: true,
    } as RetryableRequest
  )
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

/** refresh 결과 반영 — access token은 메모리에만, 만료 시각은 기존처럼 localStorage에도 남긴다 (auth-store 저장 정책과 동일) */
function persistAccessToken(accessToken: string, expiresAtIso?: string) {
  const expires = expiresAtIso ?? new Date(Date.now() + 60 * 60 * 1000).toISOString()

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(AUTH_EXPIRY_KEY, expires)
  }
  recordTokenIssuedAt()

  useAuthStore.setState({
    token: accessToken,
    expiresAt: expires,
  })
}

/** 본문 refreshToken이 없으면(쿠키 전용 운영) 저장값을 undefined로 덮지 않고 쿠키 세션으로 전환한다 */
function persistRefreshToken(refreshToken: string | null) {
  storeRefreshTokenFromResponse(refreshToken)
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

function handleAuthFailure(options?: { skipRemote?: boolean }) {
  useAuthStore.getState().logout(options?.skipRemote ? { skipRemote: true } : undefined)
  if (typeof window !== 'undefined') {
    window.location.assign(
      buildLoginPathWithRedirect(`${window.location.pathname}${window.location.search}`)
    )
  }
}

function enqueueWhileRefreshing(originalRequest: RetryableRequest) {
  // 대기열에서 새 토큰으로 재시도한 요청이 다시 401이면 refresh를 또 시작하지 않는다 (CMS와 동일)
  originalRequest._retry = true
  return new Promise((resolve, reject) => {
    failedQueue.push({
      resolve: (token: string) => {
        originalRequest.headers = setAuthorizationHeader(originalRequest.headers, token)
        resolve(axiosInstance(originalRequest))
      },
      reject: err => {
        reject(err)
      },
    })
  })
}

const REFRESH_LOCK_NAME = 'jakorea-hp-admin-refresh'

async function postRefreshAndPersist(refreshToken: string | null): Promise<string> {
  const res = await postAuthenticationRefreshToken(refreshToken)
  const newAccessToken = parseAccessTokenFromRefreshBody(res.data)
  const newRefreshToken = parseRefreshTokenFromRefreshBody(res.data)
  const expiresInSeconds = parseExpiresInFromRefreshBody(res.data)

  // QA-0137: refreshToken은 전환기에만 본문에 온다. access만 필수.
  if (!newAccessToken) {
    throw new Error('Invalid refresh response: missing access token')
  }

  const expiresAtIso =
    expiresInSeconds && expiresInSeconds > 0
      ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      : undefined

  persistAccessToken(newAccessToken, expiresAtIso)
  persistRefreshToken(newRefreshToken)

  return newAccessToken
}

/**
 * 잠금 안에서 refresh 수단을 다시 읽는다. 다른 탭이 먼저 rotate했으면 그 새 값(전환기 본문) 또는 갱신된 쿠키를 쓴다.
 * access token은 탭마다 메모리에 있으므로 다른 탭의 토큰을 가져다 쓰지 않고 이 탭도 직접 refresh한다.
 */
async function refreshWithLatestCredential(startedWithRefreshToken: string | null): Promise<string> {
  // 저장값이 없으면(쿠키 세션) 본문 없이 쿠키로 요청한다.
  // 쿠키 세션에서 이 탭이 시작 때 쓰던 값을 다시 쓰지 않는다 — 다른 탭이 지운 rotate된 토큰일 수 있다.
  const storedRefreshToken = readRefreshToken()
  if (storedRefreshToken == null && !hasRefreshCredential() && isRefreshStorageAvailable()) {
    // 잠금을 기다리는 사이 다른 탭이 refresh 수단을 지웠다(로그아웃 등). 시작 때 값은 이미 rotate됐을 수 있어 보내지 않는다.
    throw new Error('Refresh credential was cleared while waiting for the refresh lock')
  }
  const tokenToUse = storedRefreshToken ?? (hasRefreshCredential() ? null : startedWithRefreshToken)
  try {
    return await postRefreshAndPersist(tokenToUse)
  } catch (err) {
    // 락 미지원 환경 등에서 동시 refresh에 진 경우(409 REFRESH_TOKEN_ALREADY_ROTATED, 서버 10초 유예 안):
    // 승자가 rotate한 최신 refresh 수단으로 한 번만 다시 시도한다 (같은 값 재전송 금지 — 10초 뒤면 계정 전체 폐기).
    if (isRefreshAlreadyRotatedError(err)) {
      const latest = readRefreshToken()
      if (latest && latest !== tokenToUse) return postRefreshAndPersist(latest)
      // 쿠키 세션: 승자 응답의 Set-Cookie로 브라우저 쿠키가 이미 바뀌었을 수 있다. 본문 없이 한 번만.
      if (!latest && tokenToUse == null && hasRefreshCredential()) return postRefreshAndPersist(null)
    }
    throw err
  }
}

async function refreshAcrossTabs(startedWithRefreshToken: string | null): Promise<string> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  if (locks && typeof locks.request === 'function') {
    return await locks.request(REFRESH_LOCK_NAME, () =>
      refreshWithLatestCredential(startedWithRefreshToken)
    )
  }
  return refreshWithLatestCredential(startedWithRefreshToken)
}

/**
 * refreshToken=null은 쿠키 세션(본문 없이 HttpOnly 쿠키로 refresh).
 * 요청은 중단하지 않는다 — 서버가 이미 rotate했을 수 있어 중단 뒤 재전송하면 재사용 탐지에 걸린다.
 */
async function runSingleFlightRefresh(refreshToken: string | null): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      return await refreshAcrossTabs(refreshToken)
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * 새로고침 세션 복원용. 인터셉터와 동일 single-flight·탭 간 잠금을 쓰고, 실패 원인을 나눠 돌려준다.
 * refresh 수단이 없으면 되살릴 세션이 없으므로 session-invalid.
 */
export async function refreshAccessTokenSessionWithResult(): Promise<RefreshSessionResult> {
  if (!hasRefreshCredential()) return { ok: false, kind: 'session-invalid' }
  const refreshToken = readRefreshToken()

  try {
    await runSingleFlightRefresh(refreshToken)
    return { ok: true }
  } catch (err) {
    return { ok: false, kind: classifyRefreshFailure(err) }
  }
}

/**
 * 선제·수동 갱신용. 인터셉터와 동일 single-flight를 공유한다.
 * refresh 수단(저장된 refreshToken 또는 쿠키 세션 표시)이 없거나 실패하면 false.
 */
export async function refreshAccessTokenSession(): Promise<boolean> {
  const result = await refreshAccessTokenSessionWithResult()
  return result.ok
}

axiosInstance.interceptors.request.use(
  config => {
    const retryable = config as RetryableRequest
    config.baseURL = getApiBaseUrlForPath(config.url ?? '')
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

axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError<TErrorResponse>) => {
    const { response, config } = error

    if (!response || !config) {
      return Promise.reject(error)
    }

    const originalRequest = config as RetryableRequest
    const requestUrl = resolveRequestUrl(originalRequest)
    const status = response.status
    response.data = coerceJsonFromArrayBuffer(response.data) as TErrorResponse
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
        return axiosInstance(originalRequest)
      }
      return Promise.reject(error)
    }

    if (originalRequest.skipRefresh || isExcludedFromAutoRefresh(requestUrl)) {
      return Promise.reject(error)
    }

    // CMS와 같은 판정: UNAUTHORIZED·TOKEN_EXPIRED·ACCESS_TOKEN_EXPIRED
    const isAccessTokenFailure = status === 401 && isAccessTokenUnauthorizedCode(code)
    if (!isAccessTokenFailure || originalRequest._retry) {
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
      return axiosInstance(originalRequest)
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
        return Promise.reject(err)
      }
      // 409 ROTATED 무효: 저장소·쿠키에는 다른 탭이 회전한 새 세션이 있을 수 있다 — 서버 logout으로 그 세션을 끊지 않는다.
      handleAuthFailure(isRefreshAlreadyRotatedError(err) ? { skipRemote: true } : undefined)
      return Promise.reject(err)
    }
  }
)
