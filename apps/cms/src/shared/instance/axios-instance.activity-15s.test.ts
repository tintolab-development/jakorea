/** @vitest-environment jsdom */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { getAdminAuthSession, postAdminAuthActivity } from '@/features/auth/api/admin-session-fetcher'
import {
  createActivityTrackerState,
  processTrustedUserActivityEvent,
} from '@/features/auth/lib/session-keepalive'
import { axiosClient } from './axios-instance'

const TOKEN_A = 'cms-live-admin-session-access-A'
const TOKEN_B = 'cms-live-admin-session-access-B'
const adapterMock = vi.fn()
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

function ok(config: InternalAxiosRequestConfig, data: unknown) {
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

describe('CMS: Activity and Session after 10-15 seconds', () => {
  const initialAdapter = axiosClient.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('auth_refresh_token', 'unused-refresh-fixture')
    useAuthStore.setState({
      token: TOKEN_A, isAuthenticated: true,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    })
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = initialAdapter
    localStorage.clear()
  })

  it('real elapsed 16s: protected Activity + Session never lose Bearer; rotation is adopted', async () => {
    let currentToken = TOKEN_A
    const requests: { path: string; auth: string | null }[] = []
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      const path = String(config.url ?? '').split('?')[0]
      const authRaw = config.headers.get('Authorization')
      const auth = authRaw == null ? null : String(authRaw)
      requests.push({ path, auth })
      if (auth !== 'Bearer ' + currentToken) throw unauthorized(config)
      if (path.endsWith('/activity')) {
        return ok(config, { lastUserActivityAt: new Date().toISOString(), updated: true })
      }
      if (path.endsWith('/session')) return ok(config, sessionData())
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

  it('trusted gestures at 0, 10, 15 and 45 seconds obey 45s network throttle', () => {
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

  it('expired/revoked Activity 401 stays fail-closed, never calls Refresh', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw unauthorized(config)
    })
    await expect(postAdminAuthActivity()).rejects.toMatchObject({ response: { status: 401 } })
    expect(adapterMock).toHaveBeenCalledTimes(1)
    const request = adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig
    expect(request.headers.get('Authorization')).toBe('Bearer ' + TOKEN_A)
    expect(String(request.url)).toContain('/activity')
  })

  it('a late Session 401 from a superseded token never starts Refresh or logout', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      // Simulate an access-token rotation while a Session GET is in flight.
      useAuthStore.setState({ token: TOKEN_B })
      throw unauthorized(config)
    })

    await expect(getAdminAuthSession()).rejects.toMatchObject({ response: { status: 401 } })
    expect(adapterMock).toHaveBeenCalledTimes(1)
    const sent = adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig
    expect(sent.headers.get('Authorization')).toBe('Bearer ' + TOKEN_A)
    expect(useAuthStore.getState().token).toBe(TOKEN_B)
    expect(
      adapterMock.mock.calls.every(call => {
        const config = call[0] as InternalAxiosRequestConfig
        return !String(config.url).includes('/refresh')
      })
    ).toBe(true)
  })

  it('Session GET 401 with a valid sid refreshes once and retries GET once', async () => {
    const jwt = (jti: string) =>
      'hdr.' + btoa(JSON.stringify({ accountType: 'ADMIN', sid: 'same-session', jti })).replace(/=+$/, '') + '.sig'
    const oldAccess = jwt('old')
    const newAccess = jwt('refreshed')
    localStorage.setItem('auth_token', oldAccess)
    localStorage.setItem('auth_refresh_token', 'refresh-before')
    useAuthStore.setState({ token: oldAccess })

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      const url = String(config.url ?? '')
      if (url.endsWith('/refresh')) {
        expect(config.headers.get('Authorization')).toBeFalsy()
        return ok(config, {
          accessToken: newAccess, refreshToken: 'refresh-after', expiresInSeconds: 3600,
        })
      }
      if (url.endsWith('/session')) {
        if (config.headers.get('Authorization') === 'Bearer ' + oldAccess) {
          throw unauthorized(config)
        }
        expect(config.headers.get('Authorization')).toBe('Bearer ' + newAccess)
        return ok(config, sessionData())
      }
      throw new Error('Unexpected request: ' + url)
    })

    const session = await getAdminAuthSession()
    expect(session.absoluteExpiresAt).toBeTruthy()
    expect(useAuthStore.getState().token).toBe(newAccess)
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-after')
    expect(adapterMock).toHaveBeenCalledTimes(3)
    expect(
      adapterMock.mock.calls.filter(call =>
        String((call[0] as InternalAxiosRequestConfig).url).endsWith('/refresh')
      )
    ).toHaveLength(1)
    expect(
      adapterMock.mock.calls.filter(call =>
        String((call[0] as InternalAxiosRequestConfig).url).endsWith('/session')
      )
    ).toHaveLength(2)
  })

  it('a rejected Refresh cannot logout a newer session adopted while the request was pending', async () => {
    const jwt = (jti: string) =>
      'hdr.' + btoa(JSON.stringify({ accountType: 'ADMIN', sid: 'same-session', jti })).replace(/=+$/, '') + '.sig'
    const oldAccess = jwt('old')
    const newAccess = jwt('new')
    localStorage.setItem('auth_token', oldAccess)
    localStorage.setItem('auth_refresh_token', 'refresh-old')
    useAuthStore.setState({ token: oldAccess })

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      const url = String(config.url ?? '')
      if (url.endsWith('/session')) throw unauthorized(config)
      if (url.endsWith('/refresh')) {
        // A sibling tab has already rotated to a new credential set.
        localStorage.setItem('auth_token', newAccess)
        localStorage.setItem('auth_refresh_token', 'refresh-rotated-by-other-tab')
        useAuthStore.setState({ token: newAccess })
        throw unauthorized(config)
      }
      throw new Error('Unexpected request: ' + url)
    })

    await expect(getAdminAuthSession()).rejects.toMatchObject({ response: { status: 401 } })
    expect(useAuthStore.getState().token).toBe(newAccess)
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-rotated-by-other-tab')
    expect(adapterMock).toHaveBeenCalledTimes(2)
  })

  it('login and Refresh stay anonymous after the Activity fix', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, {}))
    await axiosClient.post('/api/admin/auth/login', { email: 'fixture@example.invalid', password: 'fixture' })
    await axiosClient.post('/api/admin/auth/refresh', { refreshToken: 'fixture' })
    expect(adapterMock).toHaveBeenCalledTimes(2)
    for (const [config] of adapterMock.mock.calls as [InternalAxiosRequestConfig][]) {
      expect(config.headers.get('Authorization')).toBeFalsy()
    }
  })
})
