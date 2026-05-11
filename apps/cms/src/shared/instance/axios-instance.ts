/**
 * CMS(Vite)용 Axios 클라이언트.
 * - Base URL: `VITE_API_BASE_URL` (미설정 시 동일 출처 상대 경로).
 *   원격 백엔드를 ngrok으로 노출할 때는 **오리진만** 넣습니다. 예:
 *   `https://xxxx.ngrok-free.app` (끝에 `/api` 붙이지 않음 — 경로는 각 요청·`getRefreshPath`에서 합침).
 * - ngrok 무료 호스트의 브라우저 경고 페이지를 피하려면 `VITE_NGROK_SKIP_BROWSER_WARNING` 설정.
 * - 인증: `useAuthStore` 토큰 + `withCredentials`(쿠키 기반 세션과 병행 가능).
 * - 리프레시: `localStorage`의 `auth_refresh_token`(선택) + `POST` 갱신 API.
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type HeadersDefaults,
  type InternalAxiosRequestConfig,
} from 'axios'

/** auth-store와 동일한 키 — 스토어 비공개 상수와 값을 맞출 것 */
const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_EXPIRY_KEY = 'auth_expires_at'

/** 백엔드에서 리프레시 토큰을 내려줄 때 저장용 (선택) */
export const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token'

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

export type TApiErrorMessage = Record<number, string>

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipRefresh?: boolean
}

export { getApiBaseUrl, isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/** 기본 `/api/auth/refresh`; 덮어쓰려면 `VITE_AUTH_REFRESH_PATH` */
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
  return axiosClient.post<unknown>(path, { refreshToken }, {
    skipRefresh: true,
  } as RetryableRequest)
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

function readRefreshToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
}

function persistAccessToken(accessToken: string, expiresAtIso?: string) {
  const expires = expiresAtIso ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
    localStorage.setItem(AUTH_EXPIRY_KEY, expires)
  }

  useAuthStore.setState({
    token: accessToken,
    expiresAt: expires,
  })
}

function parseAccessTokenFromRefreshBody(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.length > 0) {
    return payload
  }
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    for (const key of ['accessToken', 'token', 'data'] as const) {
      const v = o[key]
      if (typeof v === 'string' && v.length > 0) return v
    }
  }
  return null
}

function handleAuthFailure() {
  useAuthStore.getState().logout()
  if (typeof window !== 'undefined') {
    const path = `${window.location.pathname}${window.location.search}`
    const next = encodeURIComponent(path)
    window.location.assign(`/login?next=${next}`)
  }
}

axiosClient.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers = config.headers ?? {}
      const headers = config.headers
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        ;(headers as Record<string, string>).Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  error => Promise.reject(error)
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

    const refreshToken = readRefreshToken()
    if (!refreshToken) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = originalRequest.headers ?? {}
            const h = originalRequest.headers
            if (typeof h.set === 'function') {
              h.set('Authorization', `Bearer ${token}`)
            } else {
              ;(h as Record<string, string>).Authorization = `Bearer ${token}`
            }
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

      if (!newAccessToken) {
        throw new Error('Invalid refresh response: missing access token')
      }

      persistAccessToken(newAccessToken)
      processQueue(newAccessToken)
      isRefreshing = false

      originalRequest.headers = originalRequest.headers ?? {}
      const h = originalRequest.headers
      if (typeof h.set === 'function') {
        h.set('Authorization', `Bearer ${newAccessToken}`)
      } else {
        ;(h as Record<string, string>).Authorization = `Bearer ${newAccessToken}`
      }

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
