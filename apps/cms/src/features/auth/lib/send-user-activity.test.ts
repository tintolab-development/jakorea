/** @vitest-environment jsdom */
/**
 * 관리자 세션 FE v2 — Activity 전 선제 Refresh.
 * 만료된(또는 곧 만료될) access token으로 Activity를 보내 401 → 재로그인되는 것을 막는다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const activityRequest = vi.hoisted(() => vi.fn())
const notifyRecorded = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/api/admin-session-fetcher', () => ({
  postAdminAuthActivity: (...args: unknown[]) => activityRequest(...args),
  isAdminAuthUnauthorizedError: (error: unknown) =>
    (error as { response?: { status?: number } } | null)?.response?.status === 401,
  isAdminAuthForbiddenError: (error: unknown) =>
    (error as { response?: { status?: number } } | null)?.response?.status === 403,
}))
vi.mock('@/features/auth/lib/admin-activity-signal', () => ({
  notifyAdminActivityRecorded: () => notifyRecorded(),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { sendUserActivity } from './send-user-activity'

const original = useAuthStore.getState()
const logout = vi.fn()
const refreshSession = vi.fn()

function seed(expiresInMs: number) {
  useAuthStore.setState({
    isAuthenticated: true,
    token: 'access-old',
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    logout,
    refreshSession,
  })
}

describe('sendUserActivity — Activity 전 선제 Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activityRequest.mockResolvedValue({ lastUserActivityAt: new Date().toISOString(), updated: true })
  })

  afterEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      expiresAt: null,
      logout: original.logout,
      refreshSession: original.refreshSession,
    })
  })

  it('access가 충분히 남아 있으면 refresh 없이 Activity를 보내고 기록을 알린다', async () => {
    seed(10 * 60_000)
    await sendUserActivity()
    expect(refreshSession).not.toHaveBeenCalled()
    expect(activityRequest).toHaveBeenCalledTimes(1)
    expect(notifyRecorded).toHaveBeenCalledTimes(1)
  })

  it('access가 이미 만료됐으면 먼저 refresh하고, 성공하면 새 토큰으로 Activity를 보낸다', async () => {
    seed(-5_000)
    refreshSession.mockImplementation(async () => {
      useAuthStore.setState({ token: 'access-new', expiresAt: new Date(Date.now() + 3600_000).toISOString() })
      return 'ok'
    })
    activityRequest.mockImplementation(async () => {
      expect(useAuthStore.getState().token).toBe('access-new')
      return { lastUserActivityAt: new Date().toISOString(), updated: true }
    })
    await sendUserActivity()
    expect(refreshSession).toHaveBeenCalledTimes(1)
    expect(activityRequest).toHaveBeenCalledTimes(1)
    expect(logout).not.toHaveBeenCalled()
  })

  it.each(['transient', 'invalid'] as const)(
    '만료 직전 refresh가 %s로 끝나면 Activity를 보내지 않고 여기서 로그아웃하지도 않는다',
    async outcome => {
      seed(10_000)
      refreshSession.mockResolvedValue(outcome)
      await sendUserActivity()
      expect(refreshSession).toHaveBeenCalledTimes(1)
      expect(activityRequest).not.toHaveBeenCalled()
      expect(logout).not.toHaveBeenCalled()
    }
  )

  it('유효한 토큰으로 보낸 Activity가 401이면 계약대로 재로그인한다', async () => {
    seed(10 * 60_000)
    activityRequest.mockRejectedValue({ response: { status: 401 } })
    await sendUserActivity()
    expect(refreshSession).not.toHaveBeenCalled()
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
