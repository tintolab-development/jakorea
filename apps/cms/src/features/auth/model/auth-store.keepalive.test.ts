/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore, ACCESS_TOKEN_EXPIRY_BUFFER_MS } from './auth-store'
import {
  TOKEN_ISSUED_AT_STORAGE_KEY,
  recordTokenIssuedAt,
  resetUserActivityForTest,
} from '@/features/auth/lib/session-keepalive'

const refreshAccessTokenSessionMock = vi.hoisted(() => vi.fn())
const logoutMock = vi.fn()

vi.mock('@/features/auth/api/fetch-admin-me', () => ({ fetchAdminMe: vi.fn() }))
vi.mock('@/shared/config/real-api-modules', () => ({ isRealApiModuleEnabled: () => true }))
vi.mock('@/shared/instance/axios-instance', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/instance/axios-instance')>()
  return {
    ...actual,
    refreshAccessTokenSession: (...args: unknown[]) => refreshAccessTokenSessionMock(...args),
    // checkSessionExpiry는 실패 종류가 필요해 Outcome을 쓴다 — 같은 mock을 ok/invalid로 매핑
    refreshAccessTokenSessionOutcome: async (...args: unknown[]) =>
      ((await refreshAccessTokenSessionMock(...args)) ? 'ok' : 'invalid'),
  }
})

const MIN = 60 * 1000
const USER = {
  id: 'admin-uuid',
  email: 'admin@example.com',
  name: '관리자',
  role: 'ADMIN',
  roleCode: 'MASTER',
  adminLevel: 'GENERAL',
  isActive: true,
  createdAt: null,
  updatedAt: null,
} as const

function seedSession(opts: { expiresInMs: number; issuedAgoMs?: number | null; refresh?: boolean }) {
  const expiresAt = new Date(Date.now() + opts.expiresInMs).toISOString()
  localStorage.setItem('auth_expires_at', expiresAt)
  localStorage.setItem('auth_user', JSON.stringify(USER))
  if (opts.refresh !== false) localStorage.setItem('auth_refresh_token', 'refresh')
  if (opts.issuedAgoMs != null) recordTokenIssuedAt(Date.now() - opts.issuedAgoMs)
  useAuthStore.setState({
    user: { ...USER },
    token: 'access-token',
    expiresAt,
    isAuthenticated: true,
    logout: logoutMock,
  })
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('checkSessionExpiry — refresh-first / 활동 게이트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    refreshAccessTokenSessionMock.mockReset()
    refreshAccessTokenSessionMock.mockResolvedValue(true)
    resetUserActivityForTest(Date.now())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('access 만료 임박이면 logout 대신 refresh하고, 성공하면 logout하지 않는다', async () => {
    seedSession({ expiresInMs: ACCESS_TOKEN_EXPIRY_BUFFER_MS - 5_000, issuedAgoMs: 59 * MIN })

    const loggedOut = useAuthStore.getState().checkSessionExpiry()
    await flush()

    expect(loggedOut).toBe(false)
    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('만료 임박 + refresh 실패일 때만 logout한다', async () => {
    refreshAccessTokenSessionMock.mockResolvedValue(false)
    seedSession({ expiresInMs: 5_000, issuedAgoMs: 59 * MIN })

    useAuthStore.getState().checkSessionExpiry()
    expect(logoutMock).not.toHaveBeenCalled() // refresh 결과를 기다리는 동안엔 logout 없음
    await flush()

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('이미 만료됐어도 refresh token이 있으면 refresh를 먼저 시도한다', async () => {
    seedSession({ expiresInMs: -10 * MIN, issuedAgoMs: 70 * MIN })

    useAuthStore.getState().checkSessionExpiry()
    await flush()

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('만료 임박인데 refresh token이 없으면 logout한다', () => {
    seedSession({ expiresInMs: 5_000, refresh: false })

    expect(useAuthStore.getState().checkSessionExpiry()).toBe(true)
    expect(refreshAccessTokenSessionMock).not.toHaveBeenCalled()
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('활동 중 + 발급 후 20분 경과면 access가 남아 있어도 선제 refresh한다', async () => {
    seedSession({ expiresInMs: 40 * MIN, issuedAgoMs: 21 * MIN })

    useAuthStore.getState().checkSessionExpiry()
    await flush()

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('발급 후 20분 미만이면 선제 refresh하지 않는다', async () => {
    seedSession({ expiresInMs: 45 * MIN, issuedAgoMs: 15 * MIN })

    useAuthStore.getState().checkSessionExpiry()
    await flush()

    expect(refreshAccessTokenSessionMock).not.toHaveBeenCalled()
  })

  it('30분 넘게 활동이 없으면 선제 refresh하지 않는다 (만료 임박 시에만 refresh-first)', async () => {
    seedSession({ expiresInMs: 30 * MIN, issuedAgoMs: 30 * MIN })
    resetUserActivityForTest(Date.now() - 31 * MIN)

    useAuthStore.getState().checkSessionExpiry()
    await flush()

    expect(refreshAccessTokenSessionMock).not.toHaveBeenCalled()
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('선제 refresh가 실패해도(access 유효) logout하지 않는다', async () => {
    refreshAccessTokenSessionMock.mockResolvedValue(false)
    seedSession({ expiresInMs: 40 * MIN, issuedAgoMs: 21 * MIN })

    useAuthStore.getState().checkSessionExpiry()
    await flush()

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('다른 탭이 저장소 만료 시각을 늘려도 이 탭 메모리 토큰이 만료 임박이면 직접 refresh한다', async () => {
    seedSession({ expiresInMs: 10_000, issuedAgoMs: 1 * MIN })
    // 다른 탭이 refresh한 결과 — 그 탭의 access token은 이 탭이 쓸 수 없다 (QA-0137 메모리 전용)
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * MIN).toISOString())

    useAuthStore.getState().checkSessionExpiry()
    await flush()

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('발급 시각 키는 localStorage에 기록된다', () => {
    recordTokenIssuedAt(123456)
    expect(localStorage.getItem(TOKEN_ISSUED_AT_STORAGE_KEY)).toBe('123456')
  })
})

describe('loadAuthFromStorage — 새로고침 시 메모리 access token 없이 복원', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('refresh 수단이 있으면 사용자만 복원하고 access token은 비운 채 refresh 결과를 기다린다', async () => {
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 30 * MIN).toISOString())
    localStorage.setItem('auth_user', JSON.stringify(USER))
    localStorage.setItem('auth_refresh_token', 'refresh')

    const mod = await import('./auth-store')
    const state = mod.useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBeNull()
    expect(state.isBootstrapping).toBe(true)
  })

  it('쿠키 세션 표시만 있어도(QA-0137) 복원한다', async () => {
    localStorage.setItem('auth_user', JSON.stringify(USER))
    localStorage.setItem('auth_refresh_cookie_session', '1')

    const mod = await import('./auth-store')
    expect(mod.useAuthStore.getState().isAuthenticated).toBe(true)
    expect(mod.useAuthStore.getState().isBootstrapping).toBe(true)
  })

  it('이전 버전이 남긴 auth_token은 읽지 않고 지운다', async () => {
    localStorage.setItem('auth_token', 'legacy-access-token')
    localStorage.setItem('auth_user', JSON.stringify(USER))
    localStorage.setItem('auth_refresh_token', 'refresh')

    const mod = await import('./auth-store')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(mod.useAuthStore.getState().token).toBeNull()
  })

  it('refresh 수단이 없으면 복원하지 않는다', async () => {
    localStorage.setItem('auth_token', 'legacy-access-token')
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 30 * MIN).toISOString())
    localStorage.setItem('auth_user', JSON.stringify(USER))

    const mod = await import('./auth-store')
    expect(mod.useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mod.useAuthStore.getState().isBootstrapping).toBe(false)
  })
})
