/**
 * Platform(Vite)용 Axios 클라이언트.
 * - Base URL: `VITE_API_BASE_URL` (미설정 + DEV 프록시 시 동일 출처 상대 경로)
 * - 인증: `platform_auth_*` localStorage + `withCredentials`
 * - 리프레시: `POST /api/homepage/auth/refresh` (body refreshToken only, no Bearer)
 */

import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type HeadersDefaults,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
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
  skipRefresh?: boolean
  skipAuth?: boolean
}

const HOMEPAGE_AUTH_PREFIX = '/api/homepage/auth'
const DEFAULT_REFRESH_PATH = `${HOMEPAGE_AUTH_PREFIX}/refresh`
const DEFAULT_LOGOUT_PATH = `${HOMEPAGE_AUTH_PREFIX}/logout`

export { getApiBaseUrl, isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

function getRefreshPath(): string {
  const fromEnv = import.meta.env.VITE_AUTH_REFRESH_PATH?.trim()
  const path = fromEnv || DEFAULT_REFRESH_PATH
  return path.startsWith('/') ? path : `/${path}`
}

function getLogoutPath(): string {
  return DEFAULT_LOGOUT_PATH
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
  return (
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/login`) ||
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/refresh`) ||
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/logout`) ||
    path.includes(`${HOMEPAGE_AUTH_PREFIX}/signup`)
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
  return axiosClient.post<unknown>(
    path,
    { refreshToken },
    {
      skipRefresh: true,
      skipAuth: true,
    } as RetryableRequest,
  )
}

/** POST /api/homepage/auth/logout — body refreshToken only, expects 204 */
export async function postHomepageAuthLogout(refreshToken: string): Promise<void> {
  await axiosClient.post(
    getLogoutPath(),
    { refreshToken },
    {
      skipRefresh: true,
      skipAuth: true,
      validateStatus: (status: number) => status === 204 || status === 200,
    } as unknown as RetryableRequest,
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
  clearAuthTokens()
  if (typeof window !== 'undefined') {
    const path = `${window.location.pathname}${window.location.search}`
    const next = encodeURIComponent(path)
    window.location.assign(`/auth/sign-in?redirect=${next}`)
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

      setAuthTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresAtIso,
      })

      return newAccessToken
    } catch (err) {
      const axiosErr = err as AxiosError<TErrorResponse>
      const status = axiosErr.response?.status
      const code = getErrorCode(axiosErr.response?.data)

      // 동일 refresh 동시 rotation: 재POST 금지. in-flight가 있으면 상위에서 공유됨.
      // 단독 409면 세션을 신뢰할 수 없어 종료.
      if (status === 409 && code === 'CONFLICT') {
        throw err
      }

      throw err
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

axiosClient.interceptors.request.use(
  config => {
    const retryable = config as RetryableRequest
    const url = resolveRequestUrl(config)

    if (retryable.skipAuth || isExcludedFromAutoRefresh(url)) {
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

    const refreshToken = getRefreshToken()
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
      handleAuthFailure()
      return Promise.reject(err)
    }
  },
)

export default axiosClient
export { axiosClient }
