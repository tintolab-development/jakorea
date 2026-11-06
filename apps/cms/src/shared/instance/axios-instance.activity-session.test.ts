/** @vitest-environment jsdom */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosClient, refreshAccessTokenSession } from './axios-instance'
import { adminAuthPaths } from '@/shared/config/api-paths'

const logoutMock = vi.fn()
const adapterMock = vi.fn()

function jwt(payload: Record<string, unknown>) {
  const json = btoa(JSON.stringify(payload)).replace(/=+$/, '')
  return `aaa.${json}.sig`
}

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, null, {
    data: { error: { code: 'UNAUTHORIZED' } },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  })
}

describe('Activity/Session refresh 분기', () => {
  const originalAdapter = axiosClient.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('auth_token', jwt({ sid: 'sess-1' }))
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 60_000).toISOString())
    localStorage.setItem('auth_refresh_token', 'refresh-old')
    useAuthStore.setState({
      token: jwt({ sid: 'sess-1' }),
      expiresAt: null,
      logout: logoutMock,
    })
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
  })

  it('FE11 Activity 401은 Refresh 없이 실패한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw unauthorized(config)
    })

    await expect(
      axiosClient.post(adminAuthPaths.activity(), undefined, { skipRefresh: true } as never)
    ).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect((adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig).headers.get('Authorization'))
      .toBe(`Bearer ${useAuthStore.getState().token}`)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('Activity 200에는 ADMIN Bearer 헤더를 포함하고 Refresh는 호출하지 않는다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
      data: { lastUserActivityAt: '2026-11-06T12:00:00Z', updated: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))

    const response = await axiosClient.post(adminAuthPaths.activity(), undefined, {
      skipRefresh: true,
    } as never)

    expect(response.status).toBe(200)
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect((adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig).headers.get('Authorization'))
      .toBe(`Bearer ${useAuthStore.getState().token}`)
  })

  it('로그인/Refresh 전용 skipAuth 요청에는 ADMIN Bearer 헤더를 넣지 않는다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
      data: { accessToken: 'fixture', refreshToken: 'fixture2' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))

    await axiosClient.post(adminAuthPaths.refresh(), { refreshToken: 'fixture' }, {
      skipAuth: true,
      skipRefresh: true,
    } as never)

    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect((adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig).headers.get('Authorization'))
      .toBeUndefined()
  })

  it('FE13 sid 없는 Session GET 401은 Refresh 없이 재로그인한다', async () => {
    useAuthStore.setState({ token: jwt({ sub: 'admin' }), logout: logoutMock })
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw unauthorized(config)
    })

    await expect(axiosClient.get(adminAuthPaths.session())).rejects.toBeTruthy()
    expect(logoutMock).toHaveBeenCalled()
    expect(adapterMock.mock.calls.every((call: InternalAxiosRequestConfig[]) => {
      const url = String(call[0]?.url ?? '')
      return !url.includes('/refresh')
    })).toBe(true)
  })

  it('FE12 sid 있는 Session GET 401은 Refresh를 시도한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      const url = `${config.url ?? ''}`
      if (url.includes('/refresh')) {
        return {
          data: { accessToken: jwt({ sid: 'sess-1' }), refreshToken: 'refresh-new', expiresInSeconds: 3600 },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      }
      if (config.headers && typeof (config.headers as { get?: (k: string) => string }).get === 'function') {
        const auth = (config.headers as { get: (k: string) => string }).get('Authorization')
        if (auth?.includes('sess-1') && !url.includes('/refresh')) {
          throw unauthorized(config)
        }
      }
      throw unauthorized(config)
    })

    await expect(refreshAccessTokenSession()).resolves.toBe(true)
  })
})
