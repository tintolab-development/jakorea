/** @vitest-environment jsdom */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosClient, refreshAccessTokenSession } from './axios-instance'

const logoutMock = vi.fn()
const adapterMock = vi.fn()

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

/** 다른 탭이 refresh에 성공해 rotate된 refresh token만 저장소에 남긴 상황 (access token은 그 탭 메모리에만 있다) */
function simulateOtherTabRotation() {
  localStorage.setItem('auth_refresh_token', 'refresh-rotated-by-other-tab')
}

function refreshBodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? null)
}

describe('refreshAccessTokenSession — 탭 간 락 / 409 재시도 (access token 메모리 전용)', () => {
  const originalAdapter = axiosClient.defaults.adapter
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('auth_refresh_token', 'refresh-old')
    useAuthStore.setState({ token: 'access-old', expiresAt: null, logout: logoutMock })
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
    else delete (navigator as unknown as { locks?: unknown }).locks
  })

  function stubLocks(beforeCallback?: () => void) {
    const request = vi.fn(async (_name: string, cb: () => Promise<unknown>) => {
      beforeCallback?.()
      return cb()
    })
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true })
    return request
  }

  it('락이 있으면 jakorea-admin-refresh 락 안에서 refresh하고 access token은 메모리에만 둔다', async () => {
    const request = stubLocks()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: 'refresh-new', expiresInSeconds: 3600 }),
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toBe('jakorea-admin-refresh')
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().token).toBe('access-new')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-new')
    expect(localStorage.getItem('auth_issued_at')).not.toBeNull()
  })

  it('락 대기 중 다른 탭이 rotate했으면 저장소의 최신 refresh token으로 직접 refresh한다', async () => {
    stubLocks(simulateOtherTabRotation)
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-mine', refreshToken: 'refresh-after', expiresInSeconds: 3600 }),
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect(refreshBodyOf(adapterMock.mock.calls[0][0])).toEqual({
      refreshToken: 'refresh-rotated-by-other-tab',
    })
    expect(useAuthStore.getState().token).toBe('access-mine')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('락 미지원 환경: 409(REFRESH_TOKEN_ALREADY_ROTATED)면 승자가 rotate한 refresh token으로 한 번만 다시 시도한다', async () => {
    delete (navigator as unknown as { locks?: unknown }).locks
    adapterMock
      .mockImplementationOnce(async (config: InternalAxiosRequestConfig) => {
        simulateOtherTabRotation() // 승자 탭이 먼저 저장
        throw conflict(config)
      })
      .mockImplementationOnce(async (config: InternalAxiosRequestConfig) =>
        ok(config, { accessToken: 'access-retry', refreshToken: 'refresh-retry', expiresInSeconds: 3600 }),
      )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(adapterMock).toHaveBeenCalledTimes(2)
    expect(refreshBodyOf(adapterMock.mock.calls[0][0])).toEqual({ refreshToken: 'refresh-old' })
    expect(refreshBodyOf(adapterMock.mock.calls[1][0])).toEqual({
      refreshToken: 'refresh-rotated-by-other-tab',
    })
    expect(useAuthStore.getState().token).toBe('access-retry')
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-retry')
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('409인데 저장소가 그대로면(다시 보낼 새 값 없음) 같은 값을 재전송하지 않고 실패(false)로 처리한다', async () => {
    delete (navigator as unknown as { locks?: unknown }).locks
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw conflict(config)
    })

    await expect(refreshAccessTokenSession()).resolves.toBe(false)
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-old')
  })
})
