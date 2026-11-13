/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
const AUTH_USER_KEY = 'auth_user'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const SESSION_USER = {
  id: 'admin-uuid',
  email: 'admin@example.com',
  name: '관리자',
  role: 'ADMIN',
  isActive: true,
  createdAt: null,
  updatedAt: null,
} as const

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

describe('CMS: Session GET and Activity race protections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(SESSION_USER))
    localStorage.setItem(REFRESH_TOKEN_KEY, 'not-used-refresh')
    sessionRequest.mockResolvedValue(currentStatus())
    activityRequest.mockResolvedValue({ lastUserActivityAt: new Date().toISOString(), updated: true })
    useAuthStore.setState({
      token: TOKEN_OLD, isAuthenticated: true,
      user: { ...SESSION_USER },
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

  it('access tokens are memory-only: a storage write from another tab never replaces this tab token', async () => {
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: TOKEN_NEW }))
    })
    await flush()
    expect(useAuthStore.getState().token).toBe(TOKEN_OLD)
    expect(checkAuth).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })

  it('another tab logging out (auth_user removed) logs this tab out', async () => {
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: AUTH_USER_KEY, newValue: null }))
    })
    await flush()
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('same account auth_user updates in another tab keep this tab session', async () => {
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: AUTH_USER_KEY,
        newValue: JSON.stringify({ ...SESSION_USER, name: '이름 변경' }),
      }))
    })
    await flush()
    expect(useAuthStore.getState().token).toBe(TOKEN_OLD)
    expect(checkAuth).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })

  it('a different account login in another tab drops this tab token and restores via checkAuth', async () => {
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: AUTH_USER_KEY,
        newValue: JSON.stringify({ ...SESSION_USER, id: 'other-admin' }),
      }))
    })
    await flush()
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
    const idleSoon = currentStatus({
      idlePolicyEnforced: true,
      idleExpiresAt: new Date(Date.now() + 1000).toISOString(),
    })
    sessionRequest
      .mockResolvedValueOnce(idleSoon) // 최초 조회
      .mockResolvedValueOnce(idleSoon) // 유휴 경고 진입 직전 재확인 — 연장되지 않음
      .mockRejectedValueOnce(fail(401)) // 유휴 기한 경과 후 재확인
    renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { await vi.advanceTimersByTimeAsync(2300) })
    expect(sessionRequest).toHaveBeenCalledTimes(3)
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('정책 ON: 유휴 경고 진입 직전 서버가 이미 연장했으면 경고를 띄우지 않는다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T09:00:00Z'))
    sessionRequest.mockReset()
    sessionRequest
      .mockResolvedValueOnce(currentStatus({
        idlePolicyEnforced: true,
        idleExpiresAt: new Date(Date.now() + 4 * 60_000).toISOString(),
      }))
      .mockResolvedValue(currentStatus({
        idlePolicyEnforced: true,
        idleExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      }))
    const { result } = renderHook(() => useSessionTimeout())
    await flush()
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(sessionRequest).toHaveBeenCalledTimes(2)
    expect(result.current.showWarning).toBe(false)
  })

  it('정책 ON: 전역 입력 Activity가 기록되면 Session을 다시 읽고, 정책 OFF면 읽지 않는다', async () => {
    const { notifyAdminActivityRecorded } = await import('@/features/auth/lib/admin-activity-signal')
    sessionRequest.mockResolvedValue(currentStatus({
      idlePolicyEnforced: true,
      idleExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    }))
    const on = renderHook(() => useSessionTimeout())
    await flush()
    expect(sessionRequest).toHaveBeenCalledTimes(1)
    await act(async () => { notifyAdminActivityRecorded() })
    await flush()
    expect(sessionRequest).toHaveBeenCalledTimes(2)
    on.unmount()

    sessionRequest.mockClear()
    sessionRequest.mockResolvedValue(currentStatus())
    renderHook(() => useSessionTimeout())
    await flush()
    expect(sessionRequest).toHaveBeenCalledTimes(1)
    await act(async () => { notifyAdminActivityRecorded() })
    await flush()
    expect(sessionRequest).toHaveBeenCalledTimes(1)
  })

  it('같은 로그인에서 Session 재조회가 5xx로 실패해도 떠 있던 경고를 유지한다', async () => {
    sessionRequest.mockReset()
    sessionRequest
      .mockResolvedValueOnce(currentStatus({ absoluteExpiresAt: new Date(Date.now() + 3 * 60_000).toISOString() }))
      .mockRejectedValueOnce(fail(503))
    const { result } = renderHook(() => useSessionTimeout())
    await flush()
    expect(result.current.showWarning).toBe(true)
    expect(result.current.warningKind).toBe('absolute')

    await act(async () => { await result.current.syncSession() })
    await flush()
    expect(sessionRequest).toHaveBeenCalledTimes(2)
    expect(logout).not.toHaveBeenCalled()
    expect(result.current.showWarning).toBe(true)
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
