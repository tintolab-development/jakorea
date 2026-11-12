/** @vitest-environment jsdom */
/**
 * QA-0137 HttpOnly refresh 쿠키(`JA_ADMIN_RT`) 전환기 — refresh 본문·credentials·쿠키 세션 전환.
 */
import { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { REFRESH_COOKIE_SESSION_STORAGE_KEY } from '@/features/auth/lib/refresh-credential'
import { axiosClient, refreshAccessTokenSession } from './axios-instance'

const adapterMock = vi.fn()
const logoutMock = vi.fn()

function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

function lastConfig(): InternalAxiosRequestConfig {
  return adapterMock.mock.calls.at(-1)![0] as InternalAxiosRequestConfig
}

function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data
}

describe('QA-0137 admin refresh 쿠키 전환기', () => {
  const originalAdapter = axiosClient.defaults.adapter
  const originalWithCredentials = axiosClient.defaults.withCredentials
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 10_000).toISOString())
    localStorage.setItem('auth_refresh_token', 'refresh-old')
    useAuthStore.setState({ token: 'access-old', expiresAt: null, logout: logoutMock })
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
    axiosClient.defaults.withCredentials = originalWithCredentials
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
  })

  it('전환기: 저장된 refreshToken을 본문으로 보내고 credentials를 함께 보낸다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: 'refresh-new', expiresInSeconds: 3600 }),
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    const config = lastConfig()
    expect(config.url).toBe('/api/admin/auth/refresh')
    expect(bodyOf(config)).toEqual({ refreshToken: 'refresh-old' })
    expect(config.withCredentials).toBe(true)
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-new')
    expect(localStorage.getItem(REFRESH_COOKIE_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('응답 본문에 refreshToken이 없으면 undefined/null로 덮지 않고, rotate된 이전 값을 다시 보내지 않도록 쿠키 세션으로 전환한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: null, expiresInSeconds: 3600 }),
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    // QA-0137: access token은 메모리(스토어)에만 둔다
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(useAuthStore.getState().token).toBe('access-new')
    const storedRefresh = localStorage.getItem('auth_refresh_token')
    expect(storedRefresh).not.toBe('undefined')
    expect(storedRefresh).not.toBe('null')
    expect(storedRefresh).toBeNull()
    expect(localStorage.getItem(REFRESH_COOKIE_SESSION_STORAGE_KEY)).toBe('1')

    // 다음 refresh는 본문 없이 HttpOnly 쿠키로만 (서버는 본문을 쿠키보다 먼저 쓰므로 rotate된 값 재전송 금지)
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-newer', expiresInSeconds: 3600 }),
    )
    useAuthStore.setState({ token: 'access-new' })
    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    const config = lastConfig()
    expect(config.url).toBe('/api/admin/auth/refresh')
    expect(config.data == null || bodyOf(config) == null).toBe(true)
    expect(config.withCredentials).toBe(true)
    expect(useAuthStore.getState().token).toBe('access-newer')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem(REFRESH_COOKIE_SESSION_STORAGE_KEY)).toBe('1')
  })

  it('refresh 수단(저장 토큰·쿠키 세션 표시)이 모두 없으면 요청하지 않는다', async () => {
    localStorage.removeItem('auth_refresh_token')
    await expect(refreshAccessTokenSession()).resolves.toBe(false)
    expect(adapterMock).not.toHaveBeenCalled()
  })

  it('credentials는 인증 호출에만 명시된다 (클라이언트 기본값을 꺼도 refresh는 true, 일반 API는 기본값)', async () => {
    axiosClient.defaults.withCredentials = false
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: 'refresh-new' }),
    )

    await refreshAccessTokenSession()
    expect(lastConfig().withCredentials).toBe(true)

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, {}))
    await axiosClient.get('/api/admin/programs')
    expect(lastConfig().url).toBe('/api/admin/programs')
    expect(lastConfig().withCredentials).toBe(false)
  })
})
