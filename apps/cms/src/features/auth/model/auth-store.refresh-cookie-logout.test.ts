/** @vitest-environment jsdom */
/**
 * QA-0137: 로그아웃은 본문 logout(전환기)과 함께 HttpOnly refresh 쿠키 폐기 엔드포인트도 호출하고,
 * 쿠키 폐기 실패는 무시한 채 로컬 로그아웃을 끝낸다.
 */
import { type AxiosAdapter, type InternalAxiosRequestConfig, AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))
vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))
vi.mock('@/shared/utils/post-auth-redirect', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/utils/post-auth-redirect')>()
  return { ...actual, assignLoginAfterSessionEnd: vi.fn() }
})

import { axiosClient } from '@/shared/instance/axios-instance'
import { fetchAdminAuthRefreshCookieLogout } from '@/features/auth/api/admin-auth-fetcher'
import { readAccessTokenFromMemory } from '@/features/auth/lib/access-token-memory'
import { useAuthStore } from './auth-store'

const adapterMock = vi.fn()

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, null, {
    data: { error: { code: 'REFRESH_TOKEN_INVALID' } },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  })
}

function noContent(config: InternalAxiosRequestConfig) {
  return { data: '', status: 204, statusText: 'No Content', headers: {}, config }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('QA-0137 admin logout — refresh 쿠키 폐기', () => {
  const originalAdapter = axiosClient.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('auth_token', 'access-old')
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 60_000).toISOString())
    localStorage.setItem('auth_refresh_token', 'refresh-old')
    localStorage.setItem('auth_user', JSON.stringify({ id: '1', name: 'fixture' }))
    useAuthStore.setState({ token: 'access-old', isAuthenticated: true })
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
  })

  it('본문 logout과 쿠키 폐기 엔드포인트를 모두 credentials와 함께 호출한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => noContent(config))

    useAuthStore.getState().logout()
    await flush()

    const calls = adapterMock.mock.calls.map(c => c[0] as InternalAxiosRequestConfig)
    const urls = calls.map(c => c.url)
    expect(urls).toContain('/api/admin/auth/logout')
    expect(urls).toContain('/api/admin/auth/refresh/logout')
    const bodyLogout = calls.find(c => c.url === '/api/admin/auth/logout')!
    expect(JSON.parse(bodyLogout.data as string)).toEqual({ refreshToken: 'refresh-old' })
    const cookieLogout = calls.find(c => c.url === '/api/admin/auth/refresh/logout')!
    expect(cookieLogout.data == null).toBe(true)
    expect(cookieLogout.withCredentials).toBe(true)
    expect(cookieLogout.headers.get('Authorization')).toBeUndefined()
  })

  it('쿠키 폐기가 실패(401·네트워크)해도 로컬 로그아웃은 끝난다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/api/admin/auth/refresh/logout') throw unauthorized(config)
      return noContent(config)
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => useAuthStore.getState().logout()).not.toThrow()
    await flush()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth_token')).toBeNull()
    // QA-0137: 메모리 access token도 지우고, 다른 탭은 auth_user 삭제로 로그아웃을 알아챈다
    expect(readAccessTokenFromMemory()).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
    expect(localStorage.getItem('auth_refresh_token')).toBeNull()
    expect(localStorage.getItem('auth_refresh_cookie_session')).toBeNull()
    warn.mockRestore()
  })

  it('쿠키 세션(저장 refreshToken 없음)이어도 쿠키 폐기는 호출하고 본문 logout은 생략한다', async () => {
    localStorage.removeItem('auth_refresh_token')
    localStorage.setItem('auth_refresh_cookie_session', '1')
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => noContent(config))

    useAuthStore.getState().logout()
    await flush()

    const urls = adapterMock.mock.calls.map(c => (c[0] as InternalAxiosRequestConfig).url)
    expect(urls).toEqual(['/api/admin/auth/refresh/logout'])
  })

  it('fetchAdminAuthRefreshCookieLogout는 네트워크 오류도 던지지 않는다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('network', 'ERR_NETWORK', config)
    })
    await expect(fetchAdminAuthRefreshCookieLogout()).resolves.toBeUndefined()
  })
})
