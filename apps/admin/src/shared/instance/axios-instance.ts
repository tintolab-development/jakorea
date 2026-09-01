/**
 * Homepage Admin Axios 클라이언트
 * - Bearer 토큰 부착
 * - 401 시 refresh single-flight
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  AUTH_EXPIRY_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
} from '@/features/auth/model/auth-storage'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
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
  code?: number
}

export type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipRefresh?: boolean
  skipAuth?: boolean
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
    path.includes(`${prefix}/mfa/`)
  )
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

export async function postAuthenticationRefreshToken(refreshToken: string) {
  return axiosInstance.post<unknown>(
    adminAuthPaths.refresh(),
    { refreshToken },
    {
      skipRefresh: true,
      skipAuth: true,
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
    window.location.assign(`/login?redirect=${next}`)
  }
}

function enqueueWhileRefreshing(originalRequest: RetryableRequest) {
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

/** 선제·수동 갱신용. 인터셉터와 동일 single-flight를 공유한다. */
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

axiosInstance.interceptors.request.use(
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
    const code = getErrorCode(response.data)

    if (originalRequest.skipRefresh || isExcludedFromAutoRefresh(requestUrl)) {
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
      return axiosInstance(originalRequest)
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
