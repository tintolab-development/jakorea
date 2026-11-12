/** @vitest-environment jsdom */
/**
 * QA-0137: Homepage Admin 로그아웃은 본문 logout(전환기)과 함께 HttpOnly refresh 쿠키 폐기 엔드포인트도 호출하고,
 * 쿠키 폐기 실패는 무시한 채 로컬 로그아웃을 끝낸다. MFA 토큰 응답의 refreshToken은 선택이다.
 */
import { type AxiosAdapter, type InternalAxiosRequestConfig, AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { axiosInstance } from '@/shared/instance/axios-instance'
import {
  fetchAdminAuthRefresh,
  fetchAdminAuthRefreshCookieLogout,
  fetchAdminMfaVerify,
} from '@/features/auth/api/admin-auth-fetcher'
import { useAuthStore } from './auth-store'

const adapterMock = vi.fn()
/** 실 JWT 모양(3 segment) — mock 세션과 구분 */
const REMOTE_JWT = 'header.payload.signature'

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

function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('QA-0137 Homepage Admin logout — refresh 쿠키 폐기', () => {
  const originalAdapter = axiosInstance.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('hp_admin_auth_token', REMOTE_JWT)
    localStorage.setItem('hp_admin_auth_expires_at', new Date(Date.now() + 60_000).toISOString())
    localStorage.setItem('hp_admin_auth_refresh_token', 'refresh-old')
    localStorage.setItem('hp_admin_auth_user', JSON.stringify({ id: '1', isActive: true }))
    useAuthStore.setState({ token: REMOTE_JWT, isAuthenticated: true })
    axiosInstance.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
    localStorage.clear()
  })

  it('본문 logout과 쿠키 폐기 엔드포인트를 모두 credentials와 함께 호출한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => noContent(config))

    useAuthStore.getState().logout()
    await flush()

    const calls = adapterMock.mock.calls.map(c => c[0] as InternalAxiosRequestConfig)
    const bodyLogout = calls.find(c => c.url === '/api/admin/auth/logout')!
    expect(JSON.parse(bodyLogout.data as string)).toEqual({ refreshToken: 'refresh-old' })
    expect(bodyLogout.withCredentials).toBe(true)
    const cookieLogout = calls.find(c => c.url === '/api/admin/auth/refresh/logout')!
    expect(cookieLogout.data == null).toBe(true)
    expect(cookieLogout.withCredentials).toBe(true)
    expect(cookieLogout.headers.get('Authorization')).toBeUndefined()
  })

  it('쿠키 폐기가 실패(401)해도 로컬 로그아웃은 끝난다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/api/admin/auth/refresh/logout') throw unauthorized(config)
      return noContent(config)
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => useAuthStore.getState().logout()).not.toThrow()
    await flush()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem('hp_admin_auth_token')).toBeNull()
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBeNull()
    expect(localStorage.getItem('hp_admin_auth_refresh_cookie_session')).toBeNull()
    warn.mockRestore()
  })

  it('쿠키 세션(저장 refreshToken 없음)이어도 쿠키 폐기는 호출하고 본문 logout은 생략한다', async () => {
    localStorage.removeItem('hp_admin_auth_refresh_token')
    localStorage.setItem('hp_admin_auth_refresh_cookie_session', '1')
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => noContent(config))

    useAuthStore.getState().logout()
    await flush()

    const urls = adapterMock.mock.calls.map(c => (c[0] as InternalAxiosRequestConfig).url)
    expect(urls).toEqual(['/api/admin/auth/refresh/logout'])
    expect(localStorage.getItem('hp_admin_auth_refresh_cookie_session')).toBeNull()
  })

  it('mock 세션(실 JWT·refresh 수단 없음)은 서버 로그아웃을 호출하지 않는다', async () => {
    localStorage.removeItem('hp_admin_auth_refresh_token')
    localStorage.setItem('hp_admin_auth_token', 'mock-jwt-token-1')
    useAuthStore.setState({ token: 'mock-jwt-token-1' })

    useAuthStore.getState().logout()
    await flush()

    expect(adapterMock).not.toHaveBeenCalled()
  })

  it('fetchAdminAuthRefreshCookieLogout는 네트워크 오류도 던지지 않는다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('network', 'ERR_NETWORK', config)
    })
    await expect(fetchAdminAuthRefreshCookieLogout()).resolves.toBeUndefined()
  })
})

describe('QA-0137 Homepage Admin 토큰 응답 — refreshToken 선택', () => {
  const originalAdapter = axiosInstance.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    axiosInstance.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
    localStorage.clear()
  })

  it('MFA verify 응답에 refreshToken이 없어도 토큰으로 인정하고 credentials를 보낸다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { success: true, data: { accessToken: REMOTE_JWT, expiresInSeconds: 900 } })
    )

    await expect(
      fetchAdminMfaVerify({ challengeUuid: 'c-1', verificationCode: '000000' })
    ).resolves.toEqual({
      accessToken: REMOTE_JWT,
      refreshToken: undefined,
      tokenType: undefined,
      expiresInSeconds: 900,
    })
    expect((adapterMock.mock.calls[0]![0] as InternalAxiosRequestConfig).withCredentials).toBe(true)
  })

  it('MFA verify 응답에 refreshToken이 있으면 그대로 유지한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: REMOTE_JWT, refreshToken: 'refresh-1' })
    )

    const tokens = await fetchAdminMfaVerify({ challengeUuid: 'c-1', verificationCode: '000000' })
    expect(tokens.refreshToken).toBe('refresh-1')
  })

  it('MFA 완료 시 refreshToken이 없으면 쿠키 세션으로 표시하고, 있으면 저장한다', () => {
    useAuthStore.setState({ user: { id: '1', isActive: true } as never })

    useAuthStore.getState().completeAdminAuth({ accessToken: REMOTE_JWT })
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBeNull()
    expect(localStorage.getItem('hp_admin_auth_refresh_cookie_session')).toBe('1')

    useAuthStore.getState().completeAdminAuth({ accessToken: REMOTE_JWT, refreshToken: 'refresh-1' })
    expect(localStorage.getItem('hp_admin_auth_refresh_token')).toBe('refresh-1')
    expect(localStorage.getItem('hp_admin_auth_refresh_cookie_session')).toBeNull()
  })

  it('fetchAdminAuthRefresh는 refreshToken이 없으면 본문 없이 credentials로 요청한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: REMOTE_JWT })
    )

    await expect(fetchAdminAuthRefresh()).resolves.toMatchObject({ accessToken: REMOTE_JWT })
    const config = adapterMock.mock.calls[0]![0] as InternalAxiosRequestConfig
    expect(config.url).toBe('/api/admin/auth/refresh')
    expect(config.data == null).toBe(true)
    expect(config.withCredentials).toBe(true)
  })
})
