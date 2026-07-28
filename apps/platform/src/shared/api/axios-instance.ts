/**
 * Platform(Vite)용 Axios 클라이언트.
 * - Base URL: `VITE_API_BASE_URL` (미설정 + DEV 프록시 시 동일 출처 상대 경로)
 * - 인증: `platform_auth_*` localStorage + `withCredentials`
 * - 리프레시: `VITE_AUTH_REFRESH_PATH` 또는 `/api/auth/refresh`
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
  code: number
  message: string
}

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipRefresh?: boolean
}

export { getApiBaseUrl, isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

function getRefreshPath(): string {
  const fromEnv = import.meta.env.VITE_AUTH_REFRESH_PATH?.trim()
  const path = fromEnv || '/api/auth/refresh'
  return path.startsWith('/') ? path : `/${path}`
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
    } as RetryableRequest,
  )
}

let isRefreshing = false
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

function handleAuthFailure() {
  clearAuthTokens()
  if (typeof window !== 'undefined') {
    const path = `${window.location.pathname}${window.location.search}`
    const next = encodeURIComponent(path)
    window.location.assign(`/auth/sign-in?redirect=${next}`)
  }
}

axiosClient.interceptors.request.use(
  config => {
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

    if (originalRequest.skipRefresh) {
      return Promise.reject(error)
    }

    const body = response.data
    const code = body && typeof body === 'object' && 'code' in body ? body.code : undefined
    const isTokenExpired = typeof code === 'number' && code >= 60_000 && code < 70_000

    if (!isTokenExpired || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
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

    originalRequest._retry = true
    isRefreshing = true

    try {
      const res = await postAuthenticationRefreshToken(refreshToken)
      const newAccessToken = parseAccessTokenFromRefreshBody(res.data)
      const newRefreshToken = parseRefreshTokenFromRefreshBody(res.data)
      const expiresInSeconds = parseExpiresInFromRefreshBody(res.data)

      if (!newAccessToken) {
        throw new Error('Invalid refresh response: missing access token')
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
