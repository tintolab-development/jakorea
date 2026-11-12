/**
 * QA-0137 HttpOnly refresh 쿠키(`JA_MEMBER_RT`) 전환기 — 회원 포털 refresh·logout.
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '@/shared/api/axios-instance'
import {
  PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY,
  PLATFORM_AUTH_REFRESH_TOKEN_KEY,
  PLATFORM_AUTH_TOKEN_KEY,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/shared/lib/auth-token'
import { logoutPortalSession } from '@/features/auth/session/portal-logout'
import { parseAuthTokenResponse } from '@/features/auth/sign-in/api/parse-auth-token'

const adapterMock = vi.fn()

function ok(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { data, status, statusText: 'OK', headers: {}, config }
}

function httpError(config: InternalAxiosRequestConfig, status: number, code: string) {
  return new AxiosError(code, 'ERR_BAD_REQUEST', config, null, {
    data: { error: { code } },
    status,
    statusText: code,
    headers: {},
    config,
  })
}

function calls(): InternalAxiosRequestConfig[] {
  return adapterMock.mock.calls.map(c => c[0] as InternalAxiosRequestConfig)
}

function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data
}

/** 보호 API 401 → refresh → 재시도. refresh 응답은 `refreshBody` */
function mockProtectedFlow(refreshBody: unknown) {
  adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
    if (config.url === '/api/portal/auth/refresh') return ok(config, refreshBody)
    const auth = config.headers.get('Authorization')
    if (auth === 'Bearer access-old') throw httpError(config, 401, 'UNAUTHORIZED')
    return ok(config, { ok: true })
  })
}

describe('QA-0137 portal refresh 쿠키 전환기', () => {
  const originalAdapter = axiosClient.defaults.adapter
  const originalWithCredentials = axiosClient.defaults.withCredentials

  beforeEach(() => {
    adapterMock.mockReset()
    localStorage.clear()
    localStorage.setItem(PLATFORM_AUTH_TOKEN_KEY, 'access-old')
    localStorage.setItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY, 'refresh-old')
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
    axiosClient.defaults.withCredentials = originalWithCredentials
  })

  it('전환기: 저장된 refreshToken을 본문으로 보내고 credentials를 함께 보낸다', async () => {
    mockProtectedFlow({ accessToken: 'access-new', refreshToken: 'refresh-new', expiresInSeconds: 600 })

    await axiosClient.get('/api/portal/me/profile')

    const refresh = calls().find(c => c.url === '/api/portal/auth/refresh')!
    expect(bodyOf(refresh)).toEqual({ refreshToken: 'refresh-old' })
    expect(refresh.withCredentials).toBe(true)
    expect(getAccessToken()).toBe('access-new')
    expect(getRefreshToken()).toBe('refresh-new')
    expect(localStorage.getItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY)).toBeNull()
  })

  it('응답 본문에 refreshToken이 없으면 undefined/null로 덮지 않고 쿠키 세션으로 전환, 다음 refresh는 본문 없이 보낸다', async () => {
    mockProtectedFlow({ accessToken: 'access-new', refreshToken: null, expiresInSeconds: 600 })

    await axiosClient.get('/api/portal/me/profile')

    expect(getAccessToken()).toBe('access-new')
    const stored = localStorage.getItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY)
    expect(stored).not.toBe('undefined')
    expect(stored).not.toBe('null')
    // rotate된 이전 값은 다시 보내면 재사용 탐지에 걸리므로 남기지 않는다
    expect(stored).toBeNull()
    expect(localStorage.getItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY)).toBe('1')

    // 다음 401 → 본문 없이 쿠키로 refresh
    adapterMock.mockReset()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/api/portal/auth/refresh') {
        return ok(config, { accessToken: 'access-newer', expiresInSeconds: 600 })
      }
      if (config.headers.get('Authorization') === 'Bearer access-new') {
        throw httpError(config, 401, 'UNAUTHORIZED')
      }
      return ok(config, { ok: true })
    })
    await axiosClient.get('/api/portal/me/profile')

    const refresh = calls().find(c => c.url === '/api/portal/auth/refresh')!
    expect(refresh.data == null || bodyOf(refresh) == null).toBe(true)
    expect(refresh.withCredentials).toBe(true)
    expect(getAccessToken()).toBe('access-newer')
  })

  it('credentials는 인증 호출에만 명시된다 (기본값을 꺼도 refresh는 true, 일반 API는 기본값)', async () => {
    axiosClient.defaults.withCredentials = false
    mockProtectedFlow({ accessToken: 'access-new', refreshToken: 'refresh-new' })

    await axiosClient.get('/api/portal/me/profile')

    const all = calls()
    const refresh = all.find(c => c.url === '/api/portal/auth/refresh')!
    const profile = all.filter(c => c.url === '/api/portal/me/profile')
    expect(refresh.withCredentials).toBe(true)
    expect(profile.length).toBe(2)
    for (const c of profile) expect(c.withCredentials).toBe(false)
  })

  it('로그인 응답 파서는 refreshToken이 없어도 access만으로 통과한다', () => {
    const parsed = parseAuthTokenResponse({ accessToken: 'a', expiresInSeconds: 60 })
    expect(parsed.accessToken).toBe('a')
    expect(parsed.refreshToken).toBeUndefined()
    expect(() => parseAuthTokenResponse({ refreshToken: 'r' })).toThrow()
  })

  it('setAuthTokens: refreshToken이 오면 쿠키 세션 표시를 지운다', () => {
    localStorage.setItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY, '1')
    setAuthTokens({ accessToken: 'a', refreshToken: 'r' })
    expect(getRefreshToken()).toBe('r')
    expect(localStorage.getItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY)).toBeNull()
  })
})

describe('QA-0137 portal logout — refresh 쿠키 폐기', () => {
  const originalAdapter = axiosClient.defaults.adapter

  beforeEach(() => {
    adapterMock.mockReset()
    localStorage.clear()
    localStorage.setItem(PLATFORM_AUTH_TOKEN_KEY, 'access-old')
    localStorage.setItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY, 'refresh-old')
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
  })

  it('본문 logout과 쿠키 폐기 엔드포인트를 모두 호출한다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, '', 204))

    await logoutPortalSession()

    const all = calls()
    const bodyLogout = all.find(c => c.url === '/api/portal/auth/logout')!
    const cookieLogout = all.find(c => c.url === '/api/portal/auth/refresh/logout')!
    expect(bodyOf(bodyLogout)).toEqual({ refreshToken: 'refresh-old' })
    expect(cookieLogout.data == null).toBe(true)
    expect(cookieLogout.withCredentials).toBe(true)
    expect(cookieLogout.headers.get('Authorization')).toBeUndefined()
    expect(getAccessToken()).toBeNull()
  })

  it('쿠키 폐기가 실패(401·네트워크)해도 로컬 로그아웃은 끝난다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/api/portal/auth/refresh/logout') {
        throw httpError(config, 401, 'REFRESH_TOKEN_INVALID')
      }
      throw new AxiosError('network', 'ERR_NETWORK', config)
    })

    await expect(logoutPortalSession()).resolves.toBeUndefined()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(localStorage.getItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY)).toBeNull()
  })

  it('serverLogout=false(409 회전 경쟁)면 쿠키 폐기도 호출하지 않는다', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, '', 204))

    await logoutPortalSession({ serverLogout: false })

    expect(adapterMock).not.toHaveBeenCalled()
    expect(getAccessToken()).toBeNull()
  })
})
