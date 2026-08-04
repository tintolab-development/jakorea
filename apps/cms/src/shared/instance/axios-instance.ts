/**
 * CMS(Vite)용 Axios 클라이언트.
 * - Base URL: `VITE_API_BASE_URL` (미설정 시 동일 출처 상대 경로).
 *   원격 백엔드를 ngrok으로 노출할 때는 **오리진만** 넣습니다. 예:
 *   `https://xxxx.ngrok-free.app` (끝에 `/api` 붙이지 않음 — 경로는 각 요청·`getRefreshPath`에서 합침).
 * - ngrok 무료 호스트의 브라우저 경고 페이지를 피하려면 `VITE_NGROK_SKIP_BROWSER_WARNING` 설정.
 * - 인증: `useAuthStore` 토큰 + `withCredentials`(쿠키 기반 세션과 병행 가능).
 * - 리프레시: `POST /api/admin/auth/refresh` (body refreshToken only, no Bearer).
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import { recordBackendErrorForE2e } from '@/features/e2e-error-log/lib/record-from-axios-error'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import { adminAuthPaths } from '@/shared/config/api-paths'
import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type HeadersDefaults,
  type InternalAxiosRequestConfig,
} from 'axios'

/** auth-store와 동일한 키 — 스토어 비공개 상수와 값을 맞출 것 */
const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_EXPIRY_KEY = 'auth_expires_at'

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

function isExcludedFromAutoRefresh(url?: string): boolean {
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

export async function postAuthenticationRefreshToken(refreshToken: string) {
  const path = getRefreshPath()
  return axiosClient.post<unknown>(path, { refreshToken }, {
    skipRefresh: true,
    skipAuth: true,
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
  if (typeof window === 'undefined' || !window.localStorage) return null
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
}

function persistAccessToken(accessToken: string, expiresAtIso?: string) {
  const expires = expiresAtIso ?? new Date(Date.now() + 60 * 60 * 1000).toISOString()

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
    localStorage.setItem(AUTH_EXPIRY_KEY, expires)
  }

  useAuthStore.setState({
    token: accessToken,
    expiresAt: expires,
  })
}

function persistRefreshToken(refreshToken: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken)
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

function handleAuthFailure() {
  useAuthStore.getState().logout()
  if (typeof window !== 'undefined') {
    const path = `${window.location.pathname}${window.location.search}`
    const next = encodeURIComponent(path)
    window.location.assign(`/login?next=${next}`)
  }
}

function enqueueWhileRefreshing(originalRequest: RetryableRequest) {
  return new Promise((resolve, reject) => {
    failedQueue.push({
      resolve: (token: string) => {
        originalRequest.headers = setAuthorizationHeader(originalRequest.headers, token)
        resolve(axiosClient(originalRequest))
      },
      reject: err => {
        reject(err)
      },
    })
  })
}

async function runSingleFlightRefresh(refreshToken: string): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const res = await postAuthenticationRefreshToken(refreshToken)
      const newAccessToken = parseAccessTokenFromRefreshBody(res.data)
      const newRefreshToken = parseRefreshTokenFromRefreshBody(res.data)
      const expiresInSeconds = parseExpiresInFromRefreshBody(res.data)

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Invalid refresh response: missing access or refresh token')
      }

      const expiresAtIso =
        expiresInSeconds && expiresInSeconds > 0
          ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
          : undefined

      persistAccessToken(newAccessToken, expiresAtIso)
      persistRefreshToken(newRefreshToken)

      return newAccessToken
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * 선제·수동 갱신용. 인터셉터와 동일 single-flight를 공유한다.
 * refreshToken이 없거나 실패하면 false.
 */
export async function refreshAccessTokenSession(): Promise<boolean> {
  const refreshToken = readRefreshToken()
  if (!refreshToken) return false

  try {
    await runSingleFlightRefresh(refreshToken)
    return true
  } catch {
    return false
  }
}

axiosClient.interceptors.request.use(
  config => {
    const retryable = config as RetryableRequest
    const url = resolveRequestUrl(config)

    if (retryable.skipAuth || isExcludedFromAutoRefresh(url)) {
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
    // E2E/로컬: 백엔드 실패 상황·에러 코드를 Mock 로그에 기록 (/e2e-error-log)
    recordBackendErrorForE2e(error)

    const { response, config } = error

    if (!response || !config) {
      return Promise.reject(error)
    }

    const originalRequest = config as RetryableRequest
    const requestUrl = resolveRequestUrl(originalRequest)
    const status = response.status
    const code = getErrorCode(response.data)

    if (originalRequest.skipRefresh || isExcludedFromAutoRefresh(requestUrl)) {
      return Promise.reject(error)
    }

    if (status === 403 && code === 'PERMISSION_DENIED') {
      return Promise.reject(error)
    }

    const isAccessTokenFailure = status === 401 && code === 'UNAUTHORIZED'
    if (!isAccessTokenFailure || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = readRefreshToken()
    if (!refreshToken) {
      handleAuthFailure()
      return Promise.reject(error)
    }

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
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
      }
      handleAuthFailure()
      return Promise.reject(err)
    }
  }
)

export default axiosClient
export { axiosClient }
