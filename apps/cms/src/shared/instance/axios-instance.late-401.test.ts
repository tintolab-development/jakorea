/** @vitest-environment jsdom */
/**
 * F3 — 이 탭이 이미 refresh로 토큰을 바꾼 뒤 늦게 도착한 401.
 * 같은 로그인(sid)이면 원 요청만 새 토큰으로 1회 다시 보내고, refresh·로그아웃은 하지 않는다.
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosClient } from './axios-instance'

const logoutMock = vi.fn()
const adapterMock = vi.fn()

function jwt(sid: string, jti: string): string {
  return 'hdr.' + btoa(JSON.stringify({ accountType: 'ADMIN', sid, jti })).replace(/=+$/, '') + '.sig'
}
const TOKEN_OLD = jwt('session-1', 'old')
const TOKEN_REFRESHED = jwt('session-1', 'refreshed')
const TOKEN_OTHER_LOGIN = jwt('session-2', 'other')

function ok(config: InternalAxiosRequestConfig) {
  return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
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
const isRefreshCall = (config: InternalAxiosRequestConfig) => String(config.url ?? '').includes('/refresh')
// axios가 재시도에 같은 config 객체를 재사용하므로 호출 시점의 Authorization을 따로 기록한다
const sentAuth: unknown[] = []

describe('F3 늦게 도착한 401', () => {
  const originalAdapter = axiosClient.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    sentAuth.length = 0
    localStorage.clear()
    localStorage.setItem('auth_refresh_token', 'refresh-current')
    useAuthStore.setState({ token: TOKEN_OLD, isAuthenticated: true, expiresAt: null, logout: logoutMock })
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
    localStorage.clear()
  })

  function rotateDuringFirstRequest(nextToken: string | null) {
    let first = true
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      sentAuth.push(config.headers.get('Authorization'))
      if (first) {
        first = false
        // 요청이 오가는 사이 같은 탭의 다른 요청이 refresh(또는 로그아웃·다른 로그인)를 끝냈다
        useAuthStore.setState({ token: nextToken })
        throw unauthorized(config)
      }
      return ok(config)
    })
  }

  it('같은 로그인(sid)이면 새 토큰으로 1회만 다시 보내고 refresh·로그아웃은 하지 않는다', async () => {
    rotateDuringFirstRequest(TOKEN_REFRESHED)
    await expect(axiosClient.get('/api/admin/programs')).resolves.toMatchObject({ status: 200 })
    expect(adapterMock).toHaveBeenCalledTimes(2)
    expect(sentAuth[0]).toBe('Bearer ' + TOKEN_OLD)
    expect(sentAuth[1]).toBe('Bearer ' + TOKEN_REFRESHED)
    expect(adapterMock.mock.calls.some(call => isRefreshCall(call[0] as InternalAxiosRequestConfig))).toBe(false)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('다른 계정 로그인(sid 다름)이면 다시 보내지 않는다', async () => {
    rotateDuringFirstRequest(TOKEN_OTHER_LOGIN)
    await expect(axiosClient.post('/api/admin/programs', {})).rejects.toBeInstanceOf(AxiosError)
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('그 사이 로그아웃됐으면 다시 보내지 않는다', async () => {
    rotateDuringFirstRequest(null)
    await expect(axiosClient.get('/api/admin/programs')).rejects.toBeInstanceOf(AxiosError)
    expect(adapterMock).toHaveBeenCalledTimes(1)
  })

  it('Activity는 늦은 401이어도 다시 보내지 않는다', async () => {
    rotateDuringFirstRequest(TOKEN_REFRESHED)
    await expect(axiosClient.post('/api/admin/auth/activity')).rejects.toBeInstanceOf(AxiosError)
    expect(adapterMock).toHaveBeenCalledTimes(1)
  })
})
