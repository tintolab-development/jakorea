/** @vitest-environment jsdom */
/**
 * QA-0137 access token 메모리 전용 — 새로고침 세션 복원 refresh 실패 안내.
 * ① 거절(400·401·403): 로그인 화면 안내 + 로그아웃
 * ② 그 밖 실패·3초 안에 끝나지 않음: 요청은 끊지 않고 닫기·다시 시도 (실제 실패만 0.5초 뒤 조용히 1회 재시도)
 */
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const refreshOutcomeMock = vi.hoisted(() => vi.fn())
const logoutMock = vi.fn()

vi.mock('@/features/auth/api/fetch-admin-me', () => ({
  fetchAdminMe: vi.fn(async () => ({ uuid: 'admin-uuid', roleCode: 'MASTER' })),
}))
vi.mock('@/shared/config/real-api-modules', () => ({ isRealApiModuleEnabled: () => true }))
vi.mock('@/shared/instance/axios-instance', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/instance/axios-instance')>()
  return {
    ...actual,
    refreshAccessTokenSessionOutcome: (...args: unknown[]) => refreshOutcomeMock(...args),
  }
})

// auth-store를 먼저 불러야 auth-store ↔ axios-instance 순환 import에서 auth-store가 mock을 받는다
import { useAuthStore } from './auth-store'
import { classifyRefreshFailure } from '@/shared/instance/axios-instance'
import {
  SESSION_ENDED_NOTICE_STORAGE_KEY,
  consumeSessionEndedNotice,
} from '@/features/auth/lib/session-restore-notice'

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

const RESTORED_TOKEN = 'head.eyJzaWQiOiJzLTEifQ.sig'

/** 새로고침 직후 loadAuthFromStorage가 만든 상태 (메모리 토큰 없음) */
function seedReloadRestore() {
  localStorage.setItem('auth_user', JSON.stringify(USER))
  localStorage.setItem('auth_refresh_token', 'refresh-stored')
  useAuthStore.setState({
    user: { ...USER },
    token: null,
    expiresAt: null,
    isAuthenticated: true,
    isBootstrapping: true,
    restoreFailure: null,
    restoreRetrying: false,
    _reloadRestorePending: true,
    _restoreLeftToLogin: false,
    _isCheckingAuth: false,
    _checkAuthPromise: null,
    logout: logoutMock,
  })
}

/** axios-instance가 성공 시 메모리에만 토큰을 넣는 동작 */
function succeed(): 'ok' {
  useAuthStore.setState({
    token: RESTORED_TOKEN,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  })
  return 'ok'
}

function axiosFailure(status?: number, code?: string): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig
  return new AxiosError(
    'failed',
    code ?? 'ERR_BAD_RESPONSE',
    config,
    null,
    status == null ? undefined : { data: {}, status, statusText: '', headers: {}, config },
  )
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => {
    resolve = r
  })
  return { promise, resolve }
}

describe('classifyRefreshFailure — 400·401·403만 세션 종료', () => {
  it.each([400, 401, 403])('%s는 세션 종료(invalid)', status => {
    expect(classifyRefreshFailure(axiosFailure(status))).toBe('invalid')
  })

  it.each([404, 409, 422, 429, 408, 500, 502, 503])('%s는 일시 오류(transient)', status => {
    expect(classifyRefreshFailure(axiosFailure(status))).toBe('transient')
  })

  it('응답 없음(네트워크)·타임아웃·응답 본문 이상은 일시 오류', () => {
    expect(classifyRefreshFailure(axiosFailure(undefined, 'ERR_NETWORK'))).toBe('transient')
    expect(classifyRefreshFailure(axiosFailure(undefined, 'ECONNABORTED'))).toBe('transient')
    expect(classifyRefreshFailure(new Error('Invalid refresh response'))).toBe('transient')
  })
})

describe('새로고침 세션 복원 안내', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    sessionStorage.clear()
    refreshOutcomeMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function runCheckAuth(advanceMs = 1_000) {
    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(advanceMs)
    await pending
  }

  it('실제 실패 1회는 0.5초 뒤 조용히 한 번 더 시도하고, 성공하면 안내 없이 이어간다', async () => {
    seedReloadRestore()
    refreshOutcomeMock.mockResolvedValueOnce('transient').mockImplementationOnce(async () => succeed())

    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(400)
    expect(refreshOutcomeMock).toHaveBeenCalledTimes(1) // 0.5초 전에는 다시 보내지 않는다
    await vi.advanceTimersByTimeAsync(200)
    await vi.advanceTimersByTimeAsync(200)
    await pending

    expect(refreshOutcomeMock).toHaveBeenCalledTimes(2)
    const state = useAuthStore.getState()
    expect(state.token).toBe(RESTORED_TOKEN)
    expect(state.isBootstrapping).toBe(false)
    expect(state.restoreFailure).toBeNull()
    expect(logoutMock).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY)).toBeNull()
  })

  it('실제 실패가 두 번이면 로그아웃하지 않고 로딩 화면을 유지한 채 닫기·다시 시도 안내를 띄운다', async () => {
    seedReloadRestore()
    refreshOutcomeMock.mockResolvedValue('transient')

    await runCheckAuth()

    expect(refreshOutcomeMock).toHaveBeenCalledTimes(2)
    const state = useAuthStore.getState()
    expect(state.restoreFailure).toBe('network')
    expect(state.isBootstrapping).toBe(true)
    expect(state.isAuthenticated).toBe(true)
    expect(logoutMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-stored')
  })

  it('3초 안에 끝나지 않으면 요청은 그대로 둔 채 안내를 띄우고(재시도 없음), 늦게 성공하면 안내를 닫고 이어간다', async () => {
    seedReloadRestore()
    const slow = deferred<'ok'>()
    refreshOutcomeMock.mockReturnValueOnce(slow.promise)

    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(2_900)
    expect(useAuthStore.getState().restoreFailure).toBeNull()
    await vi.advanceTimersByTimeAsync(200)
    expect(useAuthStore.getState().restoreFailure).toBe('network')
    expect(useAuthStore.getState().isBootstrapping).toBe(true)

    await vi.advanceTimersByTimeAsync(5_000)
    expect(refreshOutcomeMock).toHaveBeenCalledTimes(1) // 화면 기준 시간 초과로는 다시 보내지 않는다

    slow.resolve(succeed())
    await vi.advanceTimersByTimeAsync(500)
    await pending

    const state = useAuthStore.getState()
    expect(state.restoreFailure).toBeNull()
    expect(state.isBootstrapping).toBe(false)
    expect(state.token).toBe(RESTORED_TOKEN)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('3초 안내 뒤 늦게 400·401·403이 오면 ①(로그인 화면 안내 + 로그아웃)로 바꾼다', async () => {
    seedReloadRestore()
    const slow = deferred<'invalid'>()
    refreshOutcomeMock.mockReturnValueOnce(slow.promise)

    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(3_100)
    expect(useAuthStore.getState().restoreFailure).toBe('network')

    slow.resolve('invalid')
    await vi.advanceTimersByTimeAsync(500)
    await pending

    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(refreshOutcomeMock).toHaveBeenCalledTimes(1)
    expect(consumeSessionEndedNotice()).toBe(true)
  })

  it('[다시 시도]는 진행 중 refresh가 있으면 새로 보내지 않고 합류한다', async () => {
    seedReloadRestore()
    const slow = deferred<'ok'>()
    refreshOutcomeMock.mockReturnValueOnce(slow.promise)

    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(3_100)
    const retry = useAuthStore.getState().retryReloadRestore()
    expect(useAuthStore.getState().restoreRetrying).toBe(true)

    slow.resolve(succeed())
    await vi.advanceTimersByTimeAsync(500)
    await Promise.all([pending, retry])

    expect(refreshOutcomeMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().restoreRetrying).toBe(false)
    expect(useAuthStore.getState().restoreFailure).toBeNull()
    expect(useAuthStore.getState().token).toBe(RESTORED_TOKEN)
  })

  it('[다시 시도]는 진행 중 refresh가 없으면 조용한 재시도 없이 1회만 보내고, 성공하면 복원을 마친다', async () => {
    seedReloadRestore()
    refreshOutcomeMock.mockResolvedValue('transient')
    await runCheckAuth()
    refreshOutcomeMock.mockReset()
    refreshOutcomeMock.mockResolvedValueOnce('transient')

    const first = useAuthStore.getState().retryReloadRestore()
    await vi.advanceTimersByTimeAsync(1_000)
    await first
    expect(refreshOutcomeMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().restoreFailure).toBe('network')
    expect(useAuthStore.getState().restoreRetrying).toBe(false)

    refreshOutcomeMock.mockImplementationOnce(async () => succeed())
    const second = useAuthStore.getState().retryReloadRestore()
    await vi.advanceTimersByTimeAsync(1_000)
    await second
    const state = useAuthStore.getState()
    expect(refreshOutcomeMock).toHaveBeenCalledTimes(2)
    expect(state.token).toBe(RESTORED_TOKEN)
    expect(state.isBootstrapping).toBe(false)
    expect(state.restoreFailure).toBeNull()
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('[닫기]는 refresh 수단과 저장된 사용자를 지우지 않고 비로그인 상태로 로그인 화면에 보낸다', async () => {
    seedReloadRestore()
    localStorage.setItem('auth_refresh_cookie_session', '1')
    refreshOutcomeMock.mockResolvedValue('transient')
    await runCheckAuth()

    useAuthStore.getState().leaveReloadRestoreToLogin()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isBootstrapping).toBe(false)
    expect(state.restoreFailure).toBeNull()
    expect(state._reloadRestorePending).toBe(false)
    expect(logoutMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-stored')
    expect(localStorage.getItem('auth_refresh_cookie_session')).toBe('1')
    expect(localStorage.getItem('auth_user')).not.toBeNull()
    expect(sessionStorage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY)).toBeNull()
  })

  it('[닫기] 뒤 진행 중 refresh가 늦게 성공하면 세션을 적용한다 (요청을 끊지 않는다)', async () => {
    seedReloadRestore()
    const slow = deferred<'ok'>()
    refreshOutcomeMock.mockReturnValueOnce(slow.promise)

    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(3_100)
    useAuthStore.getState().leaveReloadRestoreToLogin()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    slow.resolve(succeed())
    await vi.advanceTimersByTimeAsync(500)
    await pending

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.id).toBe(USER.id)
    expect(state.token).toBe(RESTORED_TOKEN)
    expect(state.restoreFailure).toBeNull()
    expect(state._restoreLeftToLogin).toBe(false)
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('[닫기] 뒤 늦은 일시 오류는 아무것도 바꾸지 않고 refresh 수단을 지키며 안내도 다시 띄우지 않는다', async () => {
    seedReloadRestore()
    const slow = deferred<'transient'>()
    refreshOutcomeMock.mockReturnValueOnce(slow.promise).mockResolvedValue('transient')

    const pending = useAuthStore.getState().checkAuth()
    await vi.advanceTimersByTimeAsync(3_100)
    useAuthStore.getState().leaveReloadRestoreToLogin()

    slow.resolve('transient')
    await vi.advanceTimersByTimeAsync(1_000)
    await pending

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.restoreFailure).toBeNull()
    expect(state._reloadRestorePending).toBe(false)
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-stored')
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('서버가 거절하면(invalid) 로그인 화면 안내 표시를 남기고 로그아웃한다 (재시도 없음)', async () => {
    seedReloadRestore()
    refreshOutcomeMock.mockResolvedValue('invalid')

    await runCheckAuth()

    expect(refreshOutcomeMock).toHaveBeenCalledTimes(1)
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().restoreFailure).toBeNull()
    expect(consumeSessionEndedNotice()).toBe(true)
    // 로그인 화면은 한 번만 띄운다
    expect(consumeSessionEndedNotice()).toBe(false)
  })

  it('refresh 수단이 그 사이 사라졌으면(다른 탭 로그아웃 등) 안내 없이 로그아웃만 한다', async () => {
    seedReloadRestore()
    refreshOutcomeMock.mockResolvedValue('no-credential')

    await runCheckAuth()

    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY)).toBeNull()
  })

  it('다른 탭이 이미 로그아웃해 저장된 사용자가 바뀌었으면 안내도 로그아웃도 하지 않는다', async () => {
    seedReloadRestore()
    refreshOutcomeMock.mockImplementation(async () => {
      localStorage.removeItem('auth_user')
      return 'invalid'
    })

    await runCheckAuth()

    expect(logoutMock).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY)).toBeNull()
  })

  it('비로그인(저장된 사용자 없음)은 refresh도 안내도 하지 않는다', async () => {
    useAuthStore.setState({
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
      isBootstrapping: false,
      restoreFailure: null,
      _reloadRestorePending: false,
      _restoreLeftToLogin: false,
      _isCheckingAuth: false,
      _checkAuthPromise: null,
      logout: logoutMock,
    })

    await runCheckAuth()

    expect(refreshOutcomeMock).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY)).toBeNull()
    expect(useAuthStore.getState().restoreFailure).toBeNull()
  })

  it('새로고침 복원이 아닌 갱신(다른 탭 계정 전환 등)은 기존 refresh 경로를 쓰고 안내하지 않는다', async () => {
    seedReloadRestore()
    useAuthStore.setState({ _reloadRestorePending: false })
    refreshOutcomeMock.mockResolvedValue('invalid')

    await runCheckAuth()

    expect(refreshOutcomeMock).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY)).toBeNull()
  })
})
