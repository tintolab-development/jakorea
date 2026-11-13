/** @vitest-environment jsdom */
/**
 * F4 — 409 REFRESH_TOKEN_ALREADY_ROTATED로 세션이 무효가 되면 서버 logout 없이 로컬만 정리한다.
 * F6 — 잠금을 기다리는 사이 다른 탭이 refresh 수단을 지웠으면 예전 값을 보내지 않는다.
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosInstance as client, refreshAccessTokenSessionWithResult } from './axios-instance'

const refreshOutcome = async () => ((await refreshAccessTokenSessionWithResult()).ok ? 'ok' : 'failed')

const REFRESH_KEY = 'hp_admin_auth_refresh_token'
const logoutMock = vi.fn()
const adapterMock = vi.fn()

function httpError(config: InternalAxiosRequestConfig, status: number, code: string) {
  return new AxiosError('error', 'ERR_BAD_REQUEST', config, null, {
    data: { error: { code } }, status, statusText: String(status), headers: {}, config,
  })
}
const isRefreshCall = (config: InternalAxiosRequestConfig) => String(config.url ?? '').includes('/refresh')

describe('F4·F6 refresh 정리', () => {
  const originalAdapter = client.defaults.adapter
  const original = useAuthStore.getState()
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem(REFRESH_KEY, 'refresh-old')
    useAuthStore.setState({ token: 'access-old', isAuthenticated: true, expiresAt: null, logout: logoutMock })
    client.defaults.adapter = adapterMock as unknown as AxiosAdapter
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  afterEach(() => {
    client.defaults.adapter = originalAdapter
    useAuthStore.setState({ token: null, isAuthenticated: false, logout: original.logout })
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
    else delete (navigator as unknown as { locks?: unknown }).locks
    localStorage.clear()
  })

  it('F4: 409 ROTATED로 무효가 되면 서버 logout 없이(skipRemote) 로컬만 정리한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (isRefreshCall(config)) throw httpError(config, 409, 'REFRESH_TOKEN_ALREADY_ROTATED')
      throw httpError(config, 401, 'UNAUTHORIZED')
    })
    await expect(client.get('/api/admin/popups')).rejects.toBeInstanceOf(AxiosError)
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).toHaveBeenCalledWith({ skipRemote: true })
  })

  it('F4: refresh 401(일반 무효)은 지금처럼 서버 logout까지 한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (isRefreshCall(config)) throw httpError(config, 401, 'REFRESH_TOKEN_INVALID')
      throw httpError(config, 401, 'UNAUTHORIZED')
    })
    await expect(client.get('/api/admin/popups')).rejects.toBeInstanceOf(AxiosError)
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(logoutMock.mock.calls[0][0]?.skipRemote).not.toBe(true)
  })

  it('F6: 잠금을 기다리는 사이 다른 탭이 refresh 수단을 지우면 refresh를 보내지 않는다', async () => {
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: async (_name: string, cb: () => Promise<unknown>) => {
          localStorage.clear() // 다른 탭의 로그아웃
          return cb()
        },
      },
    })
    expect(await refreshOutcome()).not.toBe('ok')
    expect(adapterMock).not.toHaveBeenCalled()
  })
})
