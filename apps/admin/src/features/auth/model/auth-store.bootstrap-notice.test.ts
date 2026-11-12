/** @vitest-environment jsdom */
/**
 * QA-0137 새로고침 세션 복원 실패 처리 — 새로고침 전 로그인 상태(저장된 사용자 + refresh 수단)일 때만.
 * ① 400·401·403만: 로컬 로그아웃 + 로그인 화면 안내(session-ended)
 * ② 그 밖의 실패(다른 4xx·형식 오류·네트워크·5xx): 로그아웃하지 않고 0.5초 뒤 한 번 조용히 재시도
 *    → 그래도 실패면 로딩 위 재시도 안내(unreachable)
 * 3초는 화면 기준일 뿐: 응답이 늦으면 요청은 그대로 두고 안내만 먼저 띄운다(중단·재시도 없음).
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BOOTSTRAP_REFRESH_NOTICE_DELAY_MS,
  BOOTSTRAP_REFRESH_RETRY_DELAY_MS,
} from '@/features/auth/lib/refresh-failure'

const USER_KEY = 'hp_admin_auth_user'
const REFRESH_KEY = 'hp_admin_auth_refresh_token'
const COOKIE_SESSION_KEY = 'hp_admin_auth_refresh_cookie_session'
const STORED_USER = JSON.stringify({ id: 'admin-1', isActive: true })
const REFRESH_URL = '/api/admin/auth/refresh'

const adapterMock = vi.fn()

function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

function withStatus(config: InternalAxiosRequestConfig, status: number) {
  return new AxiosError('failed', 'ERR_BAD_RESPONSE', config, null, {
    data: { error: { code: 'REFRESH_TOKEN_INVALID' } },
    status,
    statusText: '',
    headers: {},
    config,
  })
}

function networkError(config: InternalAxiosRequestConfig) {
  return new AxiosError('Network Error', 'ERR_NETWORK', config)
}

/** 늦게 응답하는 서버 — 테스트가 직접 성공·실패를 정한다 */
function deferredRefresh() {
  const pending: {
    config: InternalAxiosRequestConfig
    resolve: (value: unknown) => void
    reject: (error: unknown) => void
  }[] = []
  adapterMock.mockImplementation(
    (config: InternalAxiosRequestConfig) =>
      new Promise((resolve, reject) => {
        pending.push({ config, resolve, reject })
      })
  )
  return pending
}

function refreshCalls() {
  return adapterMock.mock.calls.filter(
    call => (call[0] as InternalAxiosRequestConfig).url === REFRESH_URL
  )
}

async function reloadModules() {
  vi.resetModules()
  const { useAuthStore } = await import('./auth-store')
  const { axiosInstance } = await import('@/shared/instance/axios-instance')
  axiosInstance.defaults.adapter = adapterMock as unknown as AxiosAdapter
  return { useAuthStore }
}

function seedLoggedInBeforeReload() {
  localStorage.setItem(USER_KEY, STORED_USER)
  localStorage.setItem(REFRESH_KEY, 'refresh-1')
}

describe('QA-0137 Homepage Admin 새로고침 복원 실패 안내', () => {
  const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  afterEach(() => {
    vi.useRealTimers()
    if (locksDescriptor) Object.defineProperty(navigator, 'locks', locksDescriptor)
    localStorage.clear()
  })

  it.each([400, 401, 403])('① %s: 로컬 로그아웃 후 session-ended 안내, 재시도하지 않는다', async status => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (config.url === REFRESH_URL) throw withStatus(config, status)
      return ok(config, '')
    })

    await useAuthStore.getState().checkAuth()

    const state = useAuthStore.getState()
    expect(refreshCalls()).toHaveLength(1)
    expect(state.bootstrapNotice).toBe('session-ended')
    expect(state.isAuthenticated).toBe(false)
    expect(state.isBootstrapping).toBe(false)
    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('② 네트워크 오류는 한 번만 조용히 재시도하고 성공하면 안내 없이 로그인을 이어 간다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    let attempt = 0
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      attempt += 1
      if (attempt === 1) throw networkError(config)
      return ok(config, { accessToken: 'access-2', refreshToken: 'refresh-2', expiresInSeconds: 900 })
    })

    await useAuthStore.getState().checkAuth()

    const state = useAuthStore.getState()
    expect(refreshCalls()).toHaveLength(2)
    expect(state.bootstrapNotice).toBeNull()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('access-2')
  })

  it.each([
    ['네트워크 오류', (config: InternalAxiosRequestConfig) => networkError(config)],
    ['503', (config: InternalAxiosRequestConfig) => withStatus(config, 503)],
    ['404', (config: InternalAxiosRequestConfig) => withStatus(config, 404)],
    ['409', (config: InternalAxiosRequestConfig) => withStatus(config, 409)],
    ['시간 초과', (config: InternalAxiosRequestConfig) => new AxiosError('timeout', 'ECONNABORTED', config)],
  ])('② %s가 재시도 뒤에도 이어지면 로그아웃하지 않고 로딩 위 unreachable 안내', async (_label, fail) => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw fail(config)
    })

    await useAuthStore.getState().checkAuth()

    const state = useAuthStore.getState()
    expect(refreshCalls()).toHaveLength(2)
    expect(state.bootstrapNotice).toBe('unreachable')
    expect(state.isBootstrapping).toBe(true)
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.getItem(USER_KEY)).toBe(STORED_USER)
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-1')
  })

  it('② [다시 시도]가 성공하면 안내를 닫고 로그인을 이어 간다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw networkError(config)
    })
    await useAuthStore.getState().checkAuth()
    expect(useAuthStore.getState().bootstrapNotice).toBe('unreachable')

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-retry', refreshToken: 'refresh-retry', expiresInSeconds: 900 })
    )
    await useAuthStore.getState().retryBootstrapRestore()

    const state = useAuthStore.getState()
    expect(state.bootstrapNotice).toBeNull()
    expect(state.bootstrapRetrying).toBe(false)
    expect(state.isBootstrapping).toBe(false)
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('access-retry')
    expect(state.user).toMatchObject({ id: 'admin-1' })
  })

  it('② [다시 시도]도 네트워크 오류면 안내를 유지한다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw networkError(config)
    })
    await useAuthStore.getState().checkAuth()
    await useAuthStore.getState().retryBootstrapRestore()

    const state = useAuthStore.getState()
    expect(refreshCalls()).toHaveLength(3)
    expect(state.bootstrapNotice).toBe('unreachable')
    expect(state.bootstrapRetrying).toBe(false)
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-1')
  })

  it('② [다시 시도]가 401이면 ① 흐름(로그아웃 + session-ended)으로 바뀐다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw networkError(config)
    })
    await useAuthStore.getState().checkAuth()

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      if (config.url === REFRESH_URL) throw withStatus(config, 401)
      return ok(config, '')
    })
    await useAuthStore.getState().retryBootstrapRestore()

    expect(useAuthStore.getState().bootstrapNotice).toBe('session-ended')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('② [닫기]는 로그인 화면으로 보내되 refresh 수단·저장된 사용자를 지우지 않는다', async () => {
    localStorage.setItem(USER_KEY, STORED_USER)
    localStorage.setItem(COOKIE_SESSION_KEY, '1')
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw networkError(config)
    })
    await useAuthStore.getState().checkAuth()

    useAuthStore.getState().dismissBootstrapUnreachable()

    const state = useAuthStore.getState()
    expect(state.bootstrapNotice).toBeNull()
    expect(state.isBootstrapping).toBe(false)
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.getItem(COOKIE_SESSION_KEY)).toBe('1')
    expect(localStorage.getItem(USER_KEY)).toBe(STORED_USER)
    // 서버 로그아웃(쿠키 폐기)도 부르지 않는다
    expect(
      adapterMock.mock.calls.some(call =>
        String((call[0] as InternalAxiosRequestConfig).url).includes('logout')
      )
    ).toBe(false)
  })

  it('응답 형식 오류(access token 없음)도 ② 흐름이다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, {}))

    await useAuthStore.getState().checkAuth()

    expect(refreshCalls()).toHaveLength(2)
    expect(useAuthStore.getState().bootstrapNotice).toBe('unreachable')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-1')
  })

  it('실제 실패 응답 뒤에만 0.5초 간격으로 한 번 재시도한다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    vi.useFakeTimers()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw networkError(config)
    })

    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(0)
    expect(refreshCalls()).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_RETRY_DELAY_MS - 1)
    expect(refreshCalls()).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(refreshCalls()).toHaveLength(2)
    expect(useAuthStore.getState().bootstrapNotice).toBe('unreachable')
  })

  it('3초가 지나도 끝나지 않으면 요청을 중단·재시도하지 않고 로딩 위 ② 안내만 먼저 띄우고, 늦은 성공이면 안내를 닫고 이어 간다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    vi.useFakeTimers()
    const pending = deferredRefresh()

    const check = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_NOTICE_DELAY_MS - 1)
    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect(useAuthStore.getState().bootstrapNotice).toBe('unreachable')
    expect(useAuthStore.getState().isBootstrapping).toBe(true)

    await vi.advanceTimersByTimeAsync(10_000)
    expect(refreshCalls()).toHaveLength(1)
    const config = pending[0]!.config
    expect(config.signal).toBeUndefined()
    expect(config.timeout).toBe(30_000)

    pending[0]!.resolve(ok(config, { accessToken: 'access-late', refreshToken: 'refresh-2' }))
    await check

    const state = useAuthStore.getState()
    expect(state.bootstrapNotice).toBeNull()
    expect(state.isBootstrapping).toBe(false)
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('access-late')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-2')
  })

  it('3초 뒤 늦게 401이면 ① 흐름(로그아웃 + session-ended)', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    vi.useFakeTimers()
    const pending = deferredRefresh()

    const check = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_NOTICE_DELAY_MS)
    expect(useAuthStore.getState().bootstrapNotice).toBe('unreachable')

    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, ''))
    pending[0]!.reject(withStatus(pending[0]!.config, 401))
    await check

    expect(refreshCalls()).toHaveLength(1)
    expect(useAuthStore.getState().bootstrapNotice).toBe('session-ended')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('진행 중에 [다시 시도]를 누르면 새 요청 없이 같은 결과를 기다리고 버튼은 로딩 상태', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    vi.useFakeTimers()
    const pending = deferredRefresh()

    const check = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_NOTICE_DELAY_MS)
    const retry = useAuthStore.getState().retryBootstrapRestore()
    expect(useAuthStore.getState().bootstrapRetrying).toBe(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(refreshCalls()).toHaveLength(1)

    pending[0]!.resolve(ok(pending[0]!.config, { accessToken: 'access-joined', refreshToken: 'refresh-2' }))
    await retry
    await check

    expect(refreshCalls()).toHaveLength(1)
    const state = useAuthStore.getState()
    expect(state.bootstrapRetrying).toBe(false)
    expect(state.bootstrapNotice).toBeNull()
    expect(state.token).toBe('access-joined')
  })

  it('[닫기] 뒤 늦게 성공하면 로그인 화면에 redirect가 있을 때만 로그인 상태로 바꾼다', async () => {
    seedLoggedInBeforeReload()
    window.history.replaceState(null, '', '/login?redirect=%2Fnotices')
    const { useAuthStore } = await reloadModules()
    vi.useFakeTimers()
    const pending = deferredRefresh()

    const check = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_NOTICE_DELAY_MS)
    useAuthStore.getState().dismissBootstrapUnreachable()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    pending[0]!.resolve(ok(pending[0]!.config, { accessToken: 'access-after-close', refreshToken: 'refresh-2' }))
    await check

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('access-after-close')
    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
    window.history.replaceState(null, '', '/')
  })

  it('[닫기] 뒤 늦게 성공해도 redirect가 없으면 토큰만 반영하고 화면은 그대로 둔다', async () => {
    seedLoggedInBeforeReload()
    window.history.replaceState(null, '', '/login')
    const { useAuthStore } = await reloadModules()
    vi.useFakeTimers()
    const pending = deferredRefresh()

    const check = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_NOTICE_DELAY_MS)
    useAuthStore.getState().dismissBootstrapUnreachable()

    pending[0]!.resolve(ok(pending[0]!.config, { accessToken: 'access-after-close', refreshToken: 'refresh-2' }))
    await check

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.bootstrapNotice).toBeNull()
    expect(state.token).toBe('access-after-close')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-2')
    window.history.replaceState(null, '', '/')
  })

  it('[닫기] 뒤 늦게 네트워크 실패해도 안내를 다시 띄우지 않고 refresh 수단을 지우지 않는다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    vi.useFakeTimers()
    const pending = deferredRefresh()

    const check = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_NOTICE_DELAY_MS)
    useAuthStore.getState().dismissBootstrapUnreachable()

    pending[0]!.reject(networkError(pending[0]!.config))
    await vi.advanceTimersByTimeAsync(BOOTSTRAP_REFRESH_RETRY_DELAY_MS)
    pending[1]?.reject(networkError(pending[1]!.config))
    await check

    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-1')
  })

  it('비로그인(저장된 사용자 없음)은 refresh도 안내도 없다', async () => {
    localStorage.setItem(REFRESH_KEY, 'refresh-orphan')
    const { useAuthStore } = await reloadModules()

    await useAuthStore.getState().checkAuth()

    expect(adapterMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
  })

  it('저장된 사용자만 있고 refresh 수단이 없으면(이미 로그아웃된 흔적) 안내 없이 정리한다', async () => {
    localStorage.setItem(USER_KEY, STORED_USER)
    const { useAuthStore } = await reloadModules()

    await useAuthStore.getState().checkAuth()

    expect(adapterMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('명시적 로그아웃은 안내를 띄우지 않는다', async () => {
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config, ''))
    localStorage.setItem(REFRESH_KEY, 'refresh-1')
    useAuthStore.setState({ token: 'header.payload.signature', isAuthenticated: true })

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
  })

  it('새로고침 복원 뒤 다른 탭 로그인으로 부른 checkAuth 실패는 안내 없이 기존처럼 로그아웃한다', async () => {
    seedLoggedInBeforeReload()
    const { useAuthStore } = await reloadModules()
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) =>
      ok(config, { accessToken: 'access-1', refreshToken: 'refresh-2', expiresInSeconds: 900 })
    )
    await useAuthStore.getState().checkAuth()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // 다른 탭 로그인 감지(use-session-timeout)와 같은 경로
    useAuthStore.setState({ token: null, expiresAt: null, isBootstrapping: true })
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw networkError(config)
    })
    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
