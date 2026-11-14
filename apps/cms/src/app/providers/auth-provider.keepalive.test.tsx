/** @vitest-environment jsdom */
import { act, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const refreshAccessTokenSessionMock = vi.hoisted(() => vi.fn())
const fetchAdminMeMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/api/fetch-admin-me', () => ({
  fetchAdminMe: (...args: unknown[]) => fetchAdminMeMock(...args),
}))
vi.mock('@/shared/config/real-api-modules', () => ({ isRealApiModuleEnabled: () => true }))
vi.mock('@/features/auth/ui/session-warning-modal', () => ({ SessionWarningModal: () => null }))
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

import { useAuthStore } from '@/features/auth/model/auth-store'
import { resetUserActivityForTest } from '@/features/auth/lib/session-keepalive'
import { AuthProvider } from './auth-provider'

const MIN = 60 * 1000
const logoutMock = vi.fn()
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
}

function seed(expiresInMs: number, issuedAgoMs: number) {
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString()
  localStorage.setItem('auth_expires_at', expiresAt)
  localStorage.setItem('auth_user', JSON.stringify(USER))
  localStorage.setItem('auth_refresh_token', 'refresh')
  localStorage.setItem('auth_issued_at', String(Date.now() - issuedAgoMs))
  useAuthStore.setState({
    user: { ...USER } as never,
    token: 'access-token',
    expiresAt,
    isAuthenticated: true,
    logout: logoutMock,
    _isCheckingAuth: false,
    _checkAuthPromise: null,
  })
}

describe('AuthProvider keep-alive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    refreshAccessTokenSessionMock.mockReset()
    refreshAccessTokenSessionMock.mockImplementation(async () => {
      localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * MIN).toISOString())
      localStorage.setItem('auth_issued_at', String(Date.now()))
      return true
    })
    fetchAdminMeMock.mockResolvedValue({
      uuid: 'admin-uuid',
      roleCode: 'MASTER',
      email: 'admin@example.com',
      name: '관리자',
    })
    resetUserActivityForTest(Date.now())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('init: access가 만료됐고 refresh token이 있으면 logout 대신 refresh한다', async () => {
    seed(-5 * MIN, 70 * MIN)

    await act(async () => {
      render(<AuthProvider>x</AuthProvider>)
    })

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('init: 만료됐고 refresh token도 없으면(갱신 실패) logout한다', async () => {
    seed(-5 * MIN, 70 * MIN)
    localStorage.removeItem('auth_refresh_token')
    // 실제 refreshAccessTokenSession은 refresh 수단이 없으면 요청 없이 false
    refreshAccessTokenSessionMock.mockResolvedValue(false)

    await act(async () => {
      render(<AuthProvider>x</AuthProvider>)
    })

    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('새로고침: 메모리에 access token이 없으면 보호 화면을 막은 채 refresh로 다시 받고, 브라우저 저장소에는 쓰지 않는다', async () => {
    localStorage.setItem('auth_user', JSON.stringify(USER))
    localStorage.setItem('auth_refresh_token', 'refresh')
    useAuthStore.setState({
      user: { ...USER } as never,
      token: null,
      expiresAt: null,
      isAuthenticated: true,
      isBootstrapping: true,
      logout: logoutMock,
      _isCheckingAuth: false,
      _checkAuthPromise: null,
    })
    refreshAccessTokenSessionMock.mockImplementation(async () => {
      // axios-instance가 commitRefreshedAccessToken으로 스토어(메모리)에만 반영하는 동작
      useAuthStore.setState({
        token: 'access-after-reload',
        expiresAt: new Date(Date.now() + 60 * MIN).toISOString(),
      })
      return true
    })

    await act(async () => {
      render(<AuthProvider>x</AuthProvider>)
    })

    await waitFor(() => expect(useAuthStore.getState().isBootstrapping).toBe(false))
    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe('access-after-reload')
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('새로고침: refresh가 실패하면 logout한다', async () => {
    localStorage.setItem('auth_user', JSON.stringify(USER))
    localStorage.setItem('auth_refresh_token', 'refresh')
    useAuthStore.setState({
      user: { ...USER } as never,
      token: null,
      expiresAt: null,
      isAuthenticated: true,
      isBootstrapping: true,
      logout: logoutMock,
      _isCheckingAuth: false,
      _checkAuthPromise: null,
    })
    refreshAccessTokenSessionMock.mockResolvedValue(false)

    await act(async () => {
      render(<AuthProvider>x</AuthProvider>)
    })

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('60초 interval: 만료 임박이어도 logout하지 않고 refresh한다', async () => {
    vi.useFakeTimers()
    seed(90_000, 59 * MIN) // 90초 남음 → 60초 뒤 tick에서 30초 버퍼 이내
    resetUserActivityForTest(Date.now())

    await act(async () => {
      render(<AuthProvider>x</AuthProvider>)
    })
    refreshAccessTokenSessionMock.mockClear() // init 쪽 호출 제외
    logoutMock.mockClear()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000)
    })

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('60초 interval: refresh가 실패하면 그때 logout한다', async () => {
    vi.useFakeTimers()
    seed(90_000, 59 * MIN)

    await act(async () => {
      render(<AuthProvider>x</AuthProvider>)
    })
    refreshAccessTokenSessionMock.mockReset()
    refreshAccessTokenSessionMock.mockResolvedValue(false)
    logoutMock.mockClear()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000)
    })

    expect(refreshAccessTokenSessionMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })
})
