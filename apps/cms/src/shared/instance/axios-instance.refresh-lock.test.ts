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

/** 다른 탭이 refresh에 성공해 localStorage를 갱신한 상황 */
function simulateOtherTabRotation() {
  localStorage.setItem('auth_token', 'access-from-other-tab')
  localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString())
  localStorage.setItem('auth_refresh_token', 'refresh-rotated-by-other-tab')
}

describe('refreshAccessTokenSession — 탭 간 락 / 409 채택', () => {
  const originalAdapter = axiosClient.defaults.adapter
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('auth_token', 'access-old')
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 10_000).toISOString())
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

  it('락이 있으면 jakorea-admin-refresh 락 안에서 refresh한다', async () => {
    const request = stubLocks()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-new', refreshToken: 'refresh-new', expiresInSeconds: 3600 }),
    )

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toBe('jakorea-admin-refresh')
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('auth_token')).toBe('access-new')
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-new')
    expect(localStorage.getItem('auth_issued_at')).not.toBeNull()
  })

  it('락 대기 중 다른 탭이 rotate했으면 /refresh를 호출하지 않고 그 토큰을 채택한다', async () => {
    stubLocks(simulateOtherTabRotation)

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(adapterMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe('access-from-other-tab')
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-rotated-by-other-tab')
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('락 미지원 환경: 409(REFRESH_TOKEN_ALREADY_ROTATED)면 저장소의 새 토큰을 채택하고 실패 처리하지 않는다', async () => {
    delete (navigator as unknown as { locks?: unknown }).locks
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      simulateOtherTabRotation() // 승자 탭이 먼저 저장
      throw conflict(config)
    })

    await expect(refreshAccessTokenSession()).resolves.toBe(true)

    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().token).toBe('access-from-other-tab')
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-rotated-by-other-tab')
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('409인데 저장소가 그대로면(채택할 토큰 없음) 실패(false)로 처리한다', async () => {
    delete (navigator as unknown as { locks?: unknown }).locks
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw conflict(config)
    })

    await expect(refreshAccessTokenSession()).resolves.toBe(false)
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-old')
  })
})
