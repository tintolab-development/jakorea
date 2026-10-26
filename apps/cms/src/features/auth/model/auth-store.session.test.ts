/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAuthStore,
  refreshAdminSessionFromMe,
  shouldRefreshAccessToken,
  ACCESS_TOKEN_EXPIRY_BUFFER_MS,
} from './auth-store'

const fetchAdminMeMock = vi.fn()
const refreshAccessTokenSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/api/fetch-admin-me', () => ({
  fetchAdminMe: (...args: unknown[]) => fetchAdminMeMock(...args),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/shared/instance/axios-instance', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/instance/axios-instance')>()
  return {
    ...actual,
    refreshAccessTokenSession: (...args: unknown[]) => refreshAccessTokenSessionMock(...args),
  }
})

function masterJwt(): string {
  const payload = btoa(JSON.stringify({ roleCode: 'MASTER' }))
  return `eyJhbGciOiJub25lIn0.${payload}.sig`
}

describe('auth-store remote session hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    refreshAccessTokenSessionMock.mockReset()
    refreshAccessTokenSessionMock.mockResolvedValue(true)
    useAuthStore.setState({
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
      adminSessionSyncPending: false,
      mfaState: null,
      requiresMfa: false,
      _isCheckingAuth: false,
      _checkAuthPromise: null,
    })
  })

  it('남은 수명이 충분하면 checkAuth가 refresh하지 않는다', async () => {
    const token = masterJwt()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_expires_at', expiresAt)
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'admin-uuid',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'MASTER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      }),
    )
    localStorage.setItem('auth_refresh_token', 'refresh')
    fetchAdminMeMock.mockResolvedValue({
      uuid: 'admin-uuid',
      roleCode: 'MASTER',
      email: 'admin@example.com',
      name: '관리자',
    })

    await useAuthStore.getState().checkAuth()

    expect(refreshAccessTokenSessionMock).not.toHaveBeenCalled()
    expect(shouldRefreshAccessToken(Date.now() + 60 * 60 * 1000, Date.now())).toBe(false)
  })

  it('만료 임박(30초 버퍼 이내)이면 checkAuth가 refresh 1회 한다', async () => {
    const token = masterJwt()
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS - 5_000).toISOString()
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_expires_at', expiresAt)
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'admin-uuid',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'MASTER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      }),
    )
    localStorage.setItem('auth_refresh_token', 'refresh')
    useAuthStore.setState({
      user: {
        id: 'admin-uuid',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'MASTER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      },
    })
    refreshAccessTokenSessionMock.mockImplementation(async () => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString())
      return true
    })
    fetchAdminMeMock.mockResolvedValue({
      uuid: 'admin-uuid',
      roleCode: 'MASTER',
      email: 'admin@example.com',
      name: '관리자',
    })

    await useAuthStore.getState().checkAuth()

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
  })

  it('checkAuth와 refreshToken이 동시에 발생해도 in-flight refresh는 1회다', async () => {
    let inflight: Promise<boolean> | null = null
    let started = 0
    refreshAccessTokenSessionMock.mockImplementation(() => {
      if (inflight) return inflight
      started += 1
      inflight = new Promise<boolean>(resolve => {
        setTimeout(() => resolve(true), 20)
      }).finally(() => {
        inflight = null
      })
      return inflight
    })
    useAuthStore.setState({
      user: {
        id: 'admin-uuid',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'MASTER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      },
    })
    localStorage.setItem('auth_refresh_token', 'refresh')
    localStorage.setItem('auth_token', masterJwt())
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 10_000).toISOString())
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'admin-uuid',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'MASTER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      }),
    )
    fetchAdminMeMock.mockResolvedValue({
      uuid: 'admin-uuid',
      roleCode: 'MASTER',
      email: 'admin@example.com',
      name: '관리자',
    })

    await Promise.all([
      useAuthStore.getState().checkAuth(),
      useAuthStore.getState().refreshToken(),
    ])

    expect(started).toBe(1)
  })

  it('completeAdminAuth는 placeholder VIEWER를 JWT roleCode로 덮어쓴다', () => {
    useAuthStore.setState({
      user: {
        id: 'social-sso-mfa-pending',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'VIEWER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      },
      mfaState: {
        method: 'totp',
        isRequired: true,
        isVerified: false,
        accountLabel: 'admin@example.com',
        lastSentAt: null,
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
        challengeUuid: 'challenge-1',
      },
    })

    useAuthStore.getState().completeAdminAuth({
      accessToken: masterJwt(),
      refreshToken: 'refresh-token',
      expiresInSeconds: 3600,
    })

    const stored = JSON.parse(localStorage.getItem('auth_user') ?? '{}') as {
      roleCode?: string
    }
    expect(stored.roleCode).toBe('MASTER')
    expect(localStorage.getItem('auth_token')).toBe(masterJwt())
  })

  it('checkAuth는 토큰이 있으면 /api/admin/me를 다시 호출한다', async () => {
    const token = masterJwt()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_expires_at', expiresAt)
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'social-sso-mfa-pending',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'VIEWER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      }),
    )
    localStorage.setItem('auth_refresh_token', 'refresh')

    fetchAdminMeMock.mockResolvedValue({
      uuid: 'admin-uuid',
      roleCode: 'MASTER',
      email: 'admin@example.com',
      name: '관리자',
    })

    await useAuthStore.getState().checkAuth()

    expect(fetchAdminMeMock).toHaveBeenCalledTimes(1)
    expect(refreshAccessTokenSessionMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().user?.roleCode).toBe('MASTER')
  })

  it('beginAdminMfaChallenge는 auth_user를 localStorage에 저장하지 않는다', () => {
    useAuthStore.getState().beginAdminMfaChallenge({
      challengeUuid: 'challenge-2',
    })
    expect(localStorage.getItem('auth_user')).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('refreshAdminSessionFromMe는 동기화 중 adminSessionSyncPending을 켠다', async () => {
    localStorage.setItem('auth_token', masterJwt())
    fetchAdminMeMock.mockImplementation(
      () =>
        new Promise(resolve => {
          expect(useAuthStore.getState().adminSessionSyncPending).toBe(true)
          resolve({ roleCode: 'MASTER', uuid: 'x' })
        }),
    )
    useAuthStore.setState({
      user: {
        id: 'admin-uuid',
        email: 'a@b.c',
        name: '관리자',
        role: 'ADMIN',
        roleCode: 'VIEWER',
        adminLevel: 'GENERAL',
        isActive: true,
        createdAt: null,
        updatedAt: null,
      },
      isAuthenticated: true,
    })

    await refreshAdminSessionFromMe()
    expect(useAuthStore.getState().adminSessionSyncPending).toBe(false)
  })
})
