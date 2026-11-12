/** @vitest-environment jsdom */
/**
 * QA-0137: Homepage Admin access token은 메모리에만 둔다.
 * - 로그인·MFA·refresh 어디에서도 localStorage에 access token을 쓰지 않는다.
 * - 새로고침(모듈 재로딩)하면 저장된 사용자 + refresh 수단으로 refresh해서 메모리 토큰을 다시 받는다.
 * - 로그아웃은 메모리 토큰과 저장 흔적(이전 버전 access token 포함)을 모두 지운다.
 */
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LEGACY_TOKEN_KEY = 'hp_admin_auth_token'
const USER_KEY = 'hp_admin_auth_user'
const REFRESH_KEY = 'hp_admin_auth_refresh_token'
const COOKIE_SESSION_KEY = 'hp_admin_auth_refresh_cookie_session'
const REMOTE_JWT = 'header.payload.signature'
const STORED_USER = JSON.stringify({ id: 'admin-1', isActive: true })

const adapterMock = vi.fn()

function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

function unauthorized(config: InternalAxiosRequestConfig) {
  return Promise.reject(
    Object.assign(new Error('unauthorized'), {
      isAxiosError: true,
      config,
      response: { status: 401, data: { error: { code: 'REFRESH_TOKEN_INVALID' } }, headers: {}, config },
    })
  )
}

function storageValues(): string[] {
  return Object.keys(localStorage).map(key => localStorage.getItem(key) ?? '')
}

/** 새로고침을 흉내 낸다 — 모듈을 다시 읽어 초기 상태를 localStorage에서 만든다 */
async function reloadModules() {
  vi.resetModules()
  const { useAuthStore } = await import('./auth-store')
  const { axiosInstance } = await import('@/shared/instance/axios-instance')
  axiosInstance.defaults.adapter = adapterMock as unknown as AxiosAdapter
  return { useAuthStore }
}

describe('QA-0137 Homepage Admin access token 메모리 전용', () => {
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  afterEach(() => {
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
    localStorage.clear()
  })

  it('MFA 완료로 받은 access token은 메모리에만 있고 localStorage 어디에도 쓰지 않는다', async () => {
    const { useAuthStore } = await reloadModules()
    useAuthStore.setState({ user: { id: 'admin-1', isActive: true } as never })

    useAuthStore.getState().completeAdminAuth({
      accessToken: REMOTE_JWT,
      refreshToken: 'refresh-1',
      expiresInSeconds: 900,
    })

    expect(useAuthStore.getState().token).toBe(REMOTE_JWT)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull()
    expect(storageValues()).not.toContain(REMOTE_JWT)
    expect(localStorage.getItem(USER_KEY)).toBe(STORED_USER)
  })

  it('refresh로 받은 access token도 localStorage에 쓰지 않는다', async () => {
    localStorage.setItem(REFRESH_KEY, 'refresh-old')
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-from-refresh', refreshToken: 'refresh-new', expiresInSeconds: 900 })
    )

    await expect(useAuthStore.getState().refreshToken()).resolves.toBe(true)

    expect(useAuthStore.getState().token).toBe('access-from-refresh')
    expect(storageValues()).not.toContain('access-from-refresh')
  })

  it('새로고침하면 이전 버전 access token을 지우고, refresh로 메모리 토큰을 다시 받을 때까지 보호 화면을 기다린다', async () => {
    localStorage.setItem(LEGACY_TOKEN_KEY, 'legacy-access')
    localStorage.setItem(USER_KEY, STORED_USER)
    localStorage.setItem(REFRESH_KEY, 'refresh-old')
    const { useAuthStore } = await reloadModules()

    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().isBootstrapping).toBe(true)

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-after-reload', refreshToken: 'refresh-new', expiresInSeconds: 900 })
    )
    await useAuthStore.getState().checkAuth()

    const state = useAuthStore.getState()
    expect(state.token).toBe('access-after-reload')
    expect(state.isAuthenticated).toBe(true)
    expect(state.isBootstrapping).toBe(false)
    expect(state.user).toMatchObject({ id: 'admin-1' })
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull()
    const refreshCall = adapterMock.mock.calls[0]![0] as InternalAxiosRequestConfig
    expect(refreshCall.url).toBe('/api/admin/auth/refresh')
    expect(JSON.parse(refreshCall.data as string)).toEqual({ refreshToken: 'refresh-old' })
  })

  it('쿠키 세션이면 새로고침 refresh를 본문 없이 보낸다', async () => {
    localStorage.setItem(USER_KEY, STORED_USER)
    localStorage.setItem(COOKIE_SESSION_KEY, '1')
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-cookie', expiresInSeconds: 900 })
    )

    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().token).toBe('access-cookie')
    const refreshCall = adapterMock.mock.calls[0]![0] as InternalAxiosRequestConfig
    expect(refreshCall.data == null).toBe(true)
    expect(refreshCall.withCredentials).toBe(true)
  })

  it('새로고침 refresh가 실패하면 로그아웃한다', async () => {
    localStorage.setItem(USER_KEY, STORED_USER)
    localStorage.setItem(REFRESH_KEY, 'refresh-revoked')
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/api/admin/auth/refresh') return unauthorized(config)
      return ok(config, '')
    })

    await useAuthStore.getState().checkAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.isBootstrapping).toBe(false)
    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('저장된 사용자가 없으면 refresh 없이 비로그인으로 끝낸다', async () => {
    localStorage.setItem(REFRESH_KEY, 'refresh-orphan')
    const { useAuthStore } = await reloadModules()
    expect(useAuthStore.getState().isBootstrapping).toBe(false)

    await useAuthStore.getState().checkAuth()

    expect(adapterMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('로그아웃은 메모리 토큰·저장 흔적을 모두 지운다', async () => {
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, ''))
    localStorage.setItem(LEGACY_TOKEN_KEY, 'legacy-access')
    localStorage.setItem(USER_KEY, STORED_USER)
    localStorage.setItem(REFRESH_KEY, 'refresh-1')
    localStorage.setItem('hp_admin_auth_expires_at', new Date(Date.now() + 60_000).toISOString())
    useAuthStore.setState({ token: REMOTE_JWT, isAuthenticated: true })

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    for (const key of [LEGACY_TOKEN_KEY, USER_KEY, REFRESH_KEY, COOKIE_SESSION_KEY, 'hp_admin_auth_expires_at']) {
      expect(localStorage.getItem(key)).toBeNull()
    }
  })

  it('다른 탭 로그아웃으로 정리할 때(skipRemote)는 서버 로그아웃을 다시 부르지 않는다', async () => {
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, ''))
    localStorage.setItem(REFRESH_KEY, 'refresh-1')
    useAuthStore.setState({ token: REMOTE_JWT, isAuthenticated: true })

    useAuthStore.getState().logout({ skipRemote: true })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(adapterMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })
})
