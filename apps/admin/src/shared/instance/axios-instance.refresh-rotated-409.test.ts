/** @vitest-environment jsdom */
/**
 * QA-0137 동시 refresh 경쟁 — 409 REFRESH_TOKEN_ALREADY_ROTATED.
 * 서버는 rotate 뒤 10초 안의 재전송만 409로 봐주고, 그 뒤 같은 값을 다시 받으면 계정 전체 세션을 폐기한다.
 * 그래서 승자가 남긴 새 refresh 수단으로만 한 번 다시 시도하고, 같은 값은 다시 보내지 않는다.
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { AUTH_REFRESH_COOKIE_SESSION_KEY } from '@/features/auth/model/auth-storage'
import { axiosInstance, refreshAccessTokenSessionWithResult } from './axios-instance'

const adapterMock = vi.fn()
const logoutMock = vi.fn()

function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

function conflict(config: InternalAxiosRequestConfig) {
  return new AxiosError('conflict', 'ERR_BAD_REQUEST', config, null, {
    data: { error: { code: 'REFRESH_TOKEN_ALREADY_ROTATED' } },
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config,
  })
}

function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? null)
}

describe('QA-0137 Homepage Admin — 409 REFRESH_TOKEN_ALREADY_ROTATED', () => {
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

  it('전환기: 승자 탭이 저장한 새 refresh token으로 한 번만 다시 시도한다', async () => {
    adapterMock
      .mockImplementationOnce(async (config: InternalAxiosRequestConfig) => {
        localStorage.setItem('hp_admin_auth_refresh_token', 'refresh-rotated-by-other-tab')
        throw conflict(config)
      })
      .mockImplementationOnce(async (config: InternalAxiosRequestConfig) =>
        ok(config, { accessToken: 'access-retry', refreshToken: 'refresh-retry', expiresInSeconds: 3600 })
      )

    await expect(refreshAccessTokenSessionWithResult()).resolves.toEqual({ ok: true })

    expect(adapterMock).toHaveBeenCalledTimes(2)
    expect(bodyOf(adapterMock.mock.calls[0][0])).toEqual({ refreshToken: 'refresh-old' })
    expect(bodyOf(adapterMock.mock.calls[1][0])).toEqual({ refreshToken: 'refresh-rotated-by-other-tab' })
    expect(useAuthStore.getState().token).toBe('access-retry')
  })

  it('다시 보낼 새 값이 없으면 같은 값을 재전송하지 않고 세션 종료(session-invalid)로 본다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw conflict(config)
    })

    await expect(refreshAccessTokenSessionWithResult()).resolves.toEqual({
      ok: false,
      kind: 'session-invalid',
    })
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBe('refresh-old')
  })

  it('쿠키 세션: 승자 응답이 쿠키를 바꿨을 수 있으니 본문 없이 한 번만 다시 시도한다', async () => {
    localStorage.removeItem('hp_admin_auth_refresh_token')
    localStorage.setItem(AUTH_REFRESH_COOKIE_SESSION_KEY, '1')
    adapterMock
      .mockImplementationOnce(async (config: InternalAxiosRequestConfig) => {
        throw conflict(config)
      })
      .mockImplementationOnce(async (config: InternalAxiosRequestConfig) =>
        ok(config, { accessToken: 'access-cookie-retry', expiresInSeconds: 3600 })
      )

    await expect(refreshAccessTokenSessionWithResult()).resolves.toEqual({ ok: true })

    expect(adapterMock).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().token).toBe('access-cookie-retry')
  })
})
