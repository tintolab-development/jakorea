/** @vitest-environment jsdom */
/**
 * 관리자 세션 FE v2 — refresh가 5xx·네트워크로 실패해도 세션 폐기로 단정하지 않는다.
 * 400·401·403(및 새 값 없는 409 ROTATED)만 로그아웃 근거다.
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosInstance } from './axios-instance'

const logoutMock = vi.fn()
const adapterMock = vi.fn()

function httpError(config: InternalAxiosRequestConfig, status: number, code: string) {
  return new AxiosError('error', 'ERR_BAD_RESPONSE', config, null, {
    data: { error: { code } },
    status,
    statusText: String(status),
    headers: {},
    config,
  })
}

function networkError(config: InternalAxiosRequestConfig) {
  return new AxiosError('Network Error', 'ERR_NETWORK', config, null, undefined)
}

function isRefreshCall(config: InternalAxiosRequestConfig) {
  return (config.url ?? '').includes('/auth/refresh')
}

describe('Homepage Admin 보호 API 401 → refresh 실패 종류별 로그아웃 여부', () => {
  const originalAdapter = axiosInstance.defaults.adapter
  const original = useAuthStore.getState()
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('hp_admin_auth_refresh_token', 'refresh-old')
    useAuthStore.setState({ token: 'access-old', expiresAt: null, logout: logoutMock })
    axiosInstance.defaults.adapter = adapterMock as unknown as AxiosAdapter
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
    useAuthStore.setState({ token: null, logout: original.logout })
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
    localStorage.clear()
  })

  function stubRefreshFailure(fail: (config: InternalAxiosRequestConfig) => AxiosError) {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (isRefreshCall(config)) throw fail(config)
      throw httpError(config, 401, 'UNAUTHORIZED')
    })
  }

  it('refresh 503이면 로그아웃하지 않고 원 요청을 실패로 돌려준다', async () => {
    stubRefreshFailure(config => httpError(config, 503, 'SERVICE_UNAVAILABLE'))

    await expect(axiosInstance.get('/api/admin/popups')).rejects.toBeInstanceOf(AxiosError)

    expect(logoutMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBe('refresh-old')
  })

  it('refresh 네트워크 오류면 로그아웃하지 않는다', async () => {
    stubRefreshFailure(networkError)

    await expect(axiosInstance.get('/api/admin/popups')).rejects.toBeInstanceOf(AxiosError)

    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('refresh 401이면 기존대로 로그아웃한다', async () => {
    stubRefreshFailure(config => httpError(config, 401, 'REFRESH_TOKEN_INVALID'))

    await expect(axiosInstance.get('/api/admin/popups')).rejects.toBeInstanceOf(AxiosError)

    expect(logoutMock).toHaveBeenCalled()
  })
})
