/** @vitest-environment jsdom */
/**
 * QA-0137 HttpOnly refresh 쿠키(`JA_ADMIN_RT`) 전환기 — Homepage Admin refresh 본문·credentials·쿠키 세션 전환.
 */
import { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { AUTH_REFRESH_COOKIE_SESSION_KEY } from '@/features/auth/model/auth-storage'
import { axiosInstance, refreshAccessTokenSession } from './axios-instance'

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

describe('QA-0137 Homepage Admin refresh 쿠키 전환기', () => {
  const originalAdapter = axiosInstance.defaults.adapter
  const originalWithCredentials = axiosInstance.defaults.withCredentials
  const original = useAuthStore.getState()
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('hp_admin_auth_token', 'access-old')
    localStorage.setItem('hp_admin_auth_expires_at', new Date(Date.now() + 10_000).toISOString())
    localStorage.setItem('hp_admin_auth_refresh_token', 'refresh-old')
    useAuthStore.setState({ token: 'access-old', expiresAt: null, logout: logoutMock })
    axiosInstance.defaults.adapter = adapterMock as unknown as AxiosAdapter
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
    axiosInstance.defaults.withCredentials = originalWithCredentials
    useAuthStore.setState({ token: null, logout: original.logout })
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
    localStorage.clear()
  })

  it('전환기: 저장된 refreshToken을 본문으로 보내고 credentials를 함께 보낸다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: 'refresh-new', expiresInSeconds: 3600 })
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    const config = lastConfig()
    expect(config.url).toBe('/api/admin/auth/refresh')
    expect(bodyOf(config)).toEqual({ refreshToken: 'refresh-old' })
    expect(config.withCredentials).toBe(true)
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBe('refresh-new')
    expect(localStorage.getItem(AUTH_REFRESH_COOKIE_SESSION_KEY)).toBeNull()
  })

  it('응답 본문에 refreshToken이 없으면 rotate된 이전 값을 지우고 쿠키 세션으로 전환한 뒤, 다음 refresh는 본문 없이 보낸다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: null, expiresInSeconds: 3600 })
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(localStorage.getItem('hp_admin_auth_token')).toBe('access-new')
    expect(useAuthStore.getState().token).toBe('access-new')
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBeNull()
    expect(localStorage.getItem(AUTH_REFRESH_COOKIE_SESSION_KEY)).toBe('1')

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { success: true, data: { accessToken: 'access-newer', expiresInSeconds: 3600 } })
    )
    useAuthStore.setState({ token: 'access-new' })
    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    const config = lastConfig()
    expect(config.url).toBe('/api/admin/auth/refresh')
    expect(config.data == null || bodyOf(config) == null).toBe(true)
    expect(config.withCredentials).toBe(true)
    expect(localStorage.getItem('hp_admin_auth_token')).toBe('access-newer')
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBeNull()
    expect(localStorage.getItem(AUTH_REFRESH_COOKIE_SESSION_KEY)).toBe('1')
  })

  it('쿠키 세션에서 다시 본문 refreshToken을 받으면 전환기 저장으로 돌아간다', async () => {
    localStorage.removeItem('hp_admin_auth_refresh_token')
    localStorage.setItem(AUTH_REFRESH_COOKIE_SESSION_KEY, '1')
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: 'refresh-new' })
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(lastConfig().data == null).toBe(true)
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBe('refresh-new')
    expect(localStorage.getItem(AUTH_REFRESH_COOKIE_SESSION_KEY)).toBeNull()
  })

  it('refresh 수단(저장 토큰·쿠키 세션 표시)이 모두 없으면 요청하지 않는다', async () => {
    localStorage.removeItem('hp_admin_auth_refresh_token')
    await expect(refreshAccessTokenSession()).resolves.toBe(false)
    expect(adapterMock).not.toHaveBeenCalled()
  })

  it('클라이언트 기본 credentials를 꺼도 refresh 호출은 credentials를 보낸다', async () => {
    axiosInstance.defaults.withCredentials = false
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: 'refresh-new' })
    )

    await refreshAccessTokenSession()
    expect(lastConfig().withCredentials).toBe(true)
  })
})
