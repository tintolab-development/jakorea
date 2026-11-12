/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mounted: { root: Root; container: HTMLDivElement }[] = []
function renderHook<T>(callback: () => T) {
  const result = { current: undefined as T }
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })
  function Probe() { result.current = callback(); return null }
  act(() => { root.render(<Probe />) })
  return { result }
}
function cleanup() {
  for (const { root, container } of mounted.splice(0)) {
    act(() => { root.unmount() })
    container.remove()
  }
}

const sessionRequest = vi.hoisted(() => vi.fn())
const activityRequest = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/api/admin-session-fetcher', () => ({
  getAdminAuthSession: (...args: unknown[]) => sessionRequest(...args),
  postAdminAuthActivity: (...args: unknown[]) => activityRequest(...args),
  isAdminAuthUnauthorizedError: (error: unknown) =>
    Boolean((error as { response?: { status?: number } } | null)?.response?.status === 401),
  isAdminAuthForbiddenError: (error: unknown) =>
    Boolean((error as { response?: { status?: number } } | null)?.response?.status === 403),
  isAdminAuthRetryableTransportError: (error: unknown) =>
    (error as { response?: { status?: number } } | null)?.response?.status == null ||
    ((error as { response?: { status?: number } }).response?.status ?? 0) >= 500,
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { useSessionTimeout } from './use-session-timeout'

const logout = vi.fn()
const checkAuth = vi.fn()
const AUTH_USER_KEY = 'hp_admin_auth_user'
const REFRESH_TOKEN_KEY = 'hp_admin_auth_refresh_token'

function jwt(id: string, sid: string = 'test-session'): string {
  return 'head.' + btoa(JSON.stringify({ accountType: 'ADMIN', sid, jti: id })).replace(/=+$/, '') + '.sig'
}
const TOKEN_OLD = jwt('old')
const TOKEN_NEW = jwt('new')

function currentStatus(overrides: Record<string, unknown> = {}) {
  const now = Date.now()
  return {
    sessionStartedAt: new Date(now - 10_000).toISOString(),
    absoluteExpiresAt: new Date(now + 12 * 3600_000).toISOString(),
    lastUserActivityAt: new Date(now).toISOString(),
    idleExpiresAt: null,
    refreshIdleExpiresAt: new Date(now + 30 * 60_000).toISOString(),
    idlePolicyEnforced: false,
    serverNow: new Date(now).toISOString(),
    ...overrides,
  }
}
function fail(status: number) {
  return { response: { status, data: { error: { code: status === 401 ? 'UNAUTHORIZED' : 'PERMISSION_DENIED' } } } }
}
async function flush() {
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
}

describe('Homepage Admin: Session GET and Activity race protections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: 'admin-1', isActive: true }))
    localStorage.setItem(REFRESH_TOKEN_KEY, 'not-used-refresh')
    sessionRequest.mockResolvedValue(currentStatus())
    activityRequest.mockResolvedValue({ lastUserActivityAt: new Date().toISOString(), updated: true })
    useAuthStore.setState({
      token: TOKEN_OLD, isAuthenticated: true,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      logout, checkAuth,
    })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    useAuthStore.setState({ isAuthenticated: false, token: null })
    localStorage.clear()
  })

  it.each([403, 404, 503])('Session GET %s must not revoke an authenticated login', async status => {
    sessionRequest.mockRejectedValue(fail(status))
    renderHook(() => useSessionTimeout())
    await flush()
    expect(sessionRequest).toHaveBeenCalledTimes(1)
    expect(logout).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe(TOKEN_OLD)
  })

  it('current-token Session GET 401 still logs out (fail-closed)', async () => {
    sessionRequest.mockRejectedValue(fail(401))
    renderHook(() => useSessionTimeout())
    await flush()
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('old 401 arriving after a same-session access token change must not logout', async () => {
    let rejectOld!: (error: unknown) => void
    sessionRequest.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectOld = reject }))
    sessionRequest.mockResolvedValue(currentStatus())
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { useAuthStore.setState({ token: TOKEN_NEW }) })
    await flush()
    await act(async () => { rejectOld(fail(401)) })
    await flush()
    expect(logout).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe(TOKEN_NEW)
    expect(sessionRequest).toHaveBeenCalledTimes(2)
  })

  it('old success arriving after a newer status does not replace the new warning state', async () => {
    let resolveOld!: (value: unknown) => void
    sessionRequest.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    sessionRequest.mockResolvedValueOnce(currentStatus({
      idlePolicyEnforced: true,
      idleExpiresAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    }))
    const { result } = renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { useAuthStore.setState({ token: TOKEN_NEW }) })
    await flush()
    expect(result.current.idlePolicyEnforced).toBe(true)
    await act(async () => {
      resolveOld(currentStatus({ idlePolicyEnforced: false, idleExpiresAt: null }))
    })
    await flush()
    expect(result.current.idlePolicyEnforced).toBe(true)
    expect(logout).not.toHaveBeenCalled()
  })

  it('another tab rotating the refresh credential keeps this tab\'s in-memory access token', async () => {
    renderHook(() => useSessionTimeout())
    await flush()
    localStorage.setItem(REFRESH_TOKEN_KEY, 'rotated-by-other-tab')
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: REFRESH_TOKEN_KEY, newValue: 'rotated-by-other-tab' }))
    })
    await flush()
    expect(useAuthStore.getState().token).toBe(TOKEN_OLD)
    expect(checkAuth).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })

  it('another tab logging out (stored user removed) clears this tab locally without a second server logout', async () => {
    renderHook(() => useSessionTimeout())
    await flush()
    const oldValue = localStorage.getItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: AUTH_USER_KEY, oldValue, newValue: null }))
    })
    expect(logout).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledWith({ skipRemote: true })
  })

  it('another tab logging in as a different account drops this tab\'s token and restores via checkAuth', async () => {
    renderHook(() => useSessionTimeout())
    await flush()
    const oldValue = localStorage.getItem(AUTH_USER_KEY)
    const newValue = JSON.stringify({ id: 'admin-2', isActive: true })
    localStorage.setItem(AUTH_USER_KEY, newValue)
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: AUTH_USER_KEY, oldValue, newValue }))
    })
    expect(useAuthStore.getState().token).toBeNull()
    expect(checkAuth).toHaveBeenCalledTimes(1)
    expect(logout).not.toHaveBeenCalled()
  })

  it('failed explicit extension 403 preserves login and displays an error', async () => {
    activityRequest.mockRejectedValue(fail(403))
    const { result } = renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { await result.current.extendIdleSession() })
    expect(logout).not.toHaveBeenCalled()
    expect(result.current.extendError).not.toBeNull()
  })

  it('explicit extension 401 still revokes the current session', async () => {
    activityRequest.mockRejectedValue(fail(401))
    const { result } = renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { await result.current.extendIdleSession() })
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('an enforced idle deadline rechecks the server after the warning disappears', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T09:00:00Z'))
    sessionRequest.mockReset()
    sessionRequest
      .mockResolvedValueOnce(currentStatus({
        idlePolicyEnforced: true,
        idleExpiresAt: new Date(Date.now() + 1000).toISOString(),
      }))
      .mockRejectedValueOnce(fail(401))
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { await vi.advanceTimersByTimeAsync(2300) })
    expect(sessionRequest).toHaveBeenCalledTimes(2)
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('a client countdown expiration rechecks the server before ending login', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T09:00:00Z'))
    sessionRequest.mockReset()
    sessionRequest
      .mockResolvedValueOnce(currentStatus({ absoluteExpiresAt: new Date(Date.now() + 1000).toISOString() }))
      .mockResolvedValueOnce(currentStatus())
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { await vi.advanceTimersByTimeAsync(2300) })
    expect(sessionRequest).toHaveBeenCalledTimes(2)
    expect(logout).not.toHaveBeenCalled()
  })
})
