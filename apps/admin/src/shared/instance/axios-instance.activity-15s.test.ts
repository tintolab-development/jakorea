/** @vitest-environment jsdom */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { getAdminAuthSession, postAdminAuthActivity } from '@/features/auth/api/admin-session-fetcher'
import {
  createActivityTrackerState,
  processTrustedUserActivityEvent,
} from '@/features/auth/lib/session-keepalive'
import { axiosInstance } from './axios-instance'

const TOKEN_A = 'homepage-admin-access-fixture-A'
const TOKEN_B = 'homepage-admin-access-fixture-B'
const adapterMock = vi.fn()
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

function success(config: InternalAxiosRequestConfig, data: unknown) {
  return { config, data, status: 200, statusText: 'OK', headers: {} }
}

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('401', 'ERR_BAD_REQUEST', config, null, {
    config, status: 401, statusText: 'Unauthorized', headers: {},
    data: { success: false, error: { code: 'UNAUTHORIZED' } },
  })
}

function sessionData() {
  const now = Date.now()
  return {
    sessionStartedAt: new Date(now - 60_000).toISOString(),
    absoluteExpiresAt: new Date(now + 12 * 3600_000).toISOString(),
    lastUserActivityAt: new Date(now).toISOString(),
    idleExpiresAt: null,
    refreshIdleExpiresAt: new Date(now + 30 * 60_000).toISOString(),
    idlePolicyEnforced: false,
    serverNow: new Date(now).toISOString(),
  }
}

describe('Homepage Admin: Activity and Session after 10-15 seconds', () => {
  const initialAdapter = axiosInstance.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('hp_admin_auth_refresh_token', 'unused-refresh-fixture')
    useAuthStore.setState({
      token: TOKEN_A,
      isAuthenticated: true,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    })
    axiosInstance.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = initialAdapter
    localStorage.clear()
  })

  it('real elapsed 16s: Activity and Session keep the admin Bearer after a token swap', async () => {
    let currentToken = TOKEN_A
    const requests: { path: string; auth: string | null }[] = []
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      const path = String(config.url ?? '').split('?')[0]
      const authRaw = config.headers.get('Authorization')
      const auth =
        authRaw === undefined || authRaw === null ? null : String(authRaw)
      requests.push({ path, auth })
      if (auth !== 'Bearer ' + currentToken) throw unauthorized(config)
      if (path.endsWith('/activity')) {
        return success(config, { lastUserActivityAt: new Date().toISOString(), updated: true })
      }
      if (path.endsWith('/session')) return success(config, sessionData())
      throw new Error('Unexpected endpoint: ' + path)
    })

    for (let step = 0; step <= 10; step++) {
      if (step === 6) {
        currentToken = TOKEN_B
        useAuthStore.setState({ token: TOKEN_B })
      }
      const [activity, session] = await Promise.all([
        postAdminAuthActivity(), getAdminAuthSession(),
      ])
      expect(activity.updated).toBe(true)
      expect(session.idlePolicyEnforced).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      if (step < 10) await wait(1600)
    }

    expect(requests).toHaveLength(22)
    expect(requests.filter(x => x.path.endsWith('/activity'))).toHaveLength(11)
    expect(requests.filter(x => x.path.endsWith('/session'))).toHaveLength(11)
    expect(requests.every(x => x.auth === 'Bearer ' + TOKEN_A || x.auth === 'Bearer ' + TOKEN_B)).toBe(true)
    expect(requests.some(x => x.auth === 'Bearer ' + TOKEN_B)).toBe(true)
    expect(requests.every(x => !x.path.endsWith('/refresh'))).toBe(true)
  }, 30_000)

  it('trusted events at 0, 10, 15, 45 seconds respect the 45-second network throttle', () => {
    const state = createActivityTrackerState()
    const callback = vi.fn()
    const start = Date.now()
    const event = { type: 'pointerdown', isTrusted: true, target: document.body }
    expect(processTrustedUserActivityEvent(event, state, callback, start)).toBe('network')
    expect(processTrustedUserActivityEvent(event, state, callback, start + 10_000)).toBe('local')
    expect(processTrustedUserActivityEvent(event, state, callback, start + 15_000)).toBe('local')
    expect(callback).toHaveBeenCalledTimes(1)
    expect(processTrustedUserActivityEvent(event, state, callback, start + 45_000)).toBe('network')
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('a 401 from Activity keeps Bearer but never triggers Refresh or retry', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw unauthorized(config)
    })
    await expect(postAdminAuthActivity()).rejects.toMatchObject({ response: { status: 401 } })
    expect(adapterMock).toHaveBeenCalledTimes(1)
    const config = adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig
    expect(config.headers.get('Authorization')).toBe('Bearer ' + TOKEN_A)
    expect(String(config.url)).toContain('/activity')
  })

  it('login and Refresh remain anonymous', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => success(config, {}))
    await axiosInstance.post('/api/admin/auth/login', { email: 'fixture@example.invalid', password: 'fixture' })
    await axiosInstance.post('/api/admin/auth/refresh', { refreshToken: 'fixture' })
    expect(adapterMock).toHaveBeenCalledTimes(2)
    for (const [config] of adapterMock.mock.calls as [InternalAxiosRequestConfig][]) {
      expect(config.headers.get('Authorization')).toBeFalsy()
    }
  })
})
