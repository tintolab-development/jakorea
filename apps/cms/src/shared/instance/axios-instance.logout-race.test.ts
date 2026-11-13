/** @vitest-environment jsdom */
/**
 * F5 — refresh 응답을 기다리는 사이 로그아웃하면, 늦게 도착한 응답이 토큰·refresh 수단을 되살리지 않는다.
 */
import { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))

import { getAuthGeneration } from '@/features/auth/lib/auth-generation'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosClient as client, refreshAccessTokenSessionOutcome as refreshOutcome } from './axios-instance'

const REFRESH_KEY = 'auth_refresh_token'
const COOKIE_SESSION_KEY = 'auth_refresh_cookie_session'
const adapterMock = vi.fn()

describe('F5 로그아웃과 refresh 경합', () => {
  const originalAdapter = client.defaults.adapter
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem(REFRESH_KEY, 'refresh-old')
    localStorage.setItem('auth_user', JSON.stringify({ id: 'admin-1', isActive: true }))
    useAuthStore.setState({
      token: 'access-old',
      isAuthenticated: true,
      expiresAt: null,
      user: { id: 'admin-1', isActive: true } as never,
    })
    client.defaults.adapter = adapterMock as unknown as AxiosAdapter
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  afterEach(() => {
    client.defaults.adapter = originalAdapter
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
    localStorage.clear()
  })

  it('응답 대기 중 logout하면 늦게 온 응답을 저장하지 않는다', async () => {
    let respond!: () => void
    adapterMock.mockImplementation(
      (config: InternalAxiosRequestConfig) =>
        new Promise(resolve => {
          respond = () =>
            resolve({
              data: { accessToken: 'access-late', refreshToken: 'refresh-late', expiresInSeconds: 3600 },
              status: 200, statusText: 'OK', headers: {}, config,
            })
        })
    )

    const pending = refreshOutcome()
    await vi.waitFor(() => expect(adapterMock).toHaveBeenCalledTimes(1))
    const before = getAuthGeneration()
    useAuthStore.getState().logout({ skipRemote: true })
    expect(getAuthGeneration()).toBeGreaterThan(before)
    respond()

    expect(await pending).not.toBe('ok')
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
    expect(localStorage.getItem(COOKIE_SESSION_KEY)).toBeNull()
  })

  it('세션이 그대로면 refresh 응답을 평소처럼 저장한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
      data: { accessToken: 'access-new', refreshToken: 'refresh-new', expiresInSeconds: 3600 },
      status: 200, statusText: 'OK', headers: {}, config,
    }))
    expect(await refreshOutcome()).toBe('ok')
    expect(useAuthStore.getState().token).toBe('access-new')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-new')
  })
})
