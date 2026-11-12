/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/auth-bootstrap.selfcheck.ts
 *
 * QA-0137: 새로고침·새 탭 시작 시 메모리 access token 복원과 복원 실패 안내 분류.
 */
import {
  bootstrapAccessToken,
  retryAccessTokenRestore,
  waitForAuthBootstrap,
  type AuthBootstrapDeps,
} from './auth-bootstrap.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class SessionInvalidError extends Error {}
class NetworkError extends Error {}

type Ctx = {
  deps: AuthBootstrapDeps
  calls: { peer: number; refresh: number; logout: number; wait: number }
  state: { token: string | null; credential: boolean }
}

function createCtx(
  options: {
    token?: string | null
    credential?: boolean
    /** 각 refresh 시도 결과 (순서대로). 'ok' 또는 throw할 에러 */
    refreshResults?: ('ok' | Error)[]
    peerToken?: string | null
  } = {},
): Ctx {
  const state = { token: options.token ?? null, credential: options.credential ?? true }
  const calls = { peer: 0, refresh: 0, logout: 0, wait: 0 }
  const results = [...(options.refreshResults ?? ['ok'])]
  const deps: AuthBootstrapDeps = {
    getAccessToken: () => state.token,
    hasRefreshCredential: () => state.credential,
    requestPeerAccessToken: async () => {
      calls.peer += 1
      if (options.peerToken) state.token = options.peerToken
      return options.peerToken ?? null
    },
    refresh: async () => {
      calls.refresh += 1
      const next = results.shift() ?? 'ok'
      if (next instanceof Error) throw next
      state.token = 'refreshed-token'
      return state.token
    },
    classifyFailure: error => (error instanceof SessionInvalidError ? 'session-invalid' : 'unavailable'),
    onSessionInvalid: () => {
      calls.logout += 1
      state.token = null
      state.credential = false
    },
    wait: async () => {
      calls.wait += 1
    },
  }
  return { deps, calls, state }
}

async function main() {
  // ── 안내 없음: 비로그인·이미 로그인 ──
  {
    const ctx = createCtx({ credential: false })
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'no-credential' && result.notice === null, 'guest → no notice')
    assert(ctx.calls.peer === 0 && ctx.calls.refresh === 0, 'guest → no request')
  }
  {
    const ctx = createCtx({ token: 'in-memory' })
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'already-authenticated' && result.notice === null, 'memory token → skip')
    assert(ctx.calls.refresh === 0, 'memory token → no refresh')
  }

  // ── 성공 ──
  {
    const ctx = createCtx({ peerToken: 'peer-token' })
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'peer' && result.notice === null, 'peer token → done')
    assert(ctx.calls.refresh === 0, 'peer token → no refresh')
  }
  {
    const ctx = createCtx()
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'refreshed' && result.notice === null, 'reload → refresh')
    assert(ctx.calls.peer === 1 && ctx.calls.refresh === 1, 'peer first, then refresh once')
  }

  // ── ① 세션 무효: 로그아웃 후 '로그인 종료' 안내, 재시도하지 않음 ──
  {
    const ctx = createCtx({ refreshResults: [new SessionInvalidError('401')] })
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'logged-out', 'session invalid → logged-out')
    assert(result.notice === 'session-ended', 'session invalid → session-ended notice')
    assert(ctx.calls.logout === 1, 'session invalid → logout once')
    assert(ctx.calls.refresh === 1, 'session invalid → no retry')
  }

  // ── ② 네트워크·5xx: 조용히 1회 재시도 ──
  {
    const ctx = createCtx({ refreshResults: [new NetworkError('503'), 'ok'] })
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'refreshed' && result.notice === null, 'retry succeeds silently')
    assert(ctx.calls.refresh === 2 && ctx.calls.wait === 1, 'exactly one silent retry')
    assert(ctx.calls.logout === 0, 'network failure → no logout')
  }
  {
    const ctx = createCtx({ refreshResults: [new NetworkError('net'), new NetworkError('net')] })
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'failed' && result.notice === 'unavailable', 'two failures → unavailable')
    assert(ctx.calls.refresh === 2, 'retry only once (2 attempts total)')
    assert(ctx.calls.logout === 0 && ctx.state.credential, 'unavailable keeps credential')
  }
  {
    // 재시도에서 세션 무효가 확정되면 ①로 바뀐다
    const ctx = createCtx({ refreshResults: [new NetworkError('net'), new SessionInvalidError('401')] })
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.notice === 'session-ended' && ctx.calls.logout === 1, 'retry → session invalid → ①')
  }

  // ── 실패 사이 다른 탭 로그아웃·로그인: 안내하지 않음 ──
  {
    const ctx = createCtx({ refreshResults: [new NetworkError('net')] })
    const originalRefresh = ctx.deps.refresh
    ctx.deps.refresh = async () => {
      ctx.state.credential = false // 다른 탭 로그아웃
      return originalRefresh()
    }
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'no-credential' && result.notice === null, 'other-tab logout → no notice')
    assert(ctx.calls.refresh === 1, 'other-tab logout → no retry')
  }
  {
    const ctx = createCtx({ refreshResults: [new NetworkError('net')] })
    ctx.deps.wait = async () => {
      ctx.state.token = 'from-other-tab' // 대기 중 다른 탭 로그인
    }
    const result = await bootstrapAccessToken(ctx.deps)
    assert(result.status === 'already-authenticated' && result.notice === null, 'other-tab login → no notice')
  }

  // ── 안내 모달 [다시 시도]: refresh 1회 ──
  {
    const ctx = createCtx({ refreshResults: ['ok'] })
    const result = await retryAccessTokenRestore(ctx.deps)
    assert(result.status === 'refreshed' && result.notice === null, 'retry button success')
  }
  {
    const ctx = createCtx({ refreshResults: [new NetworkError('net'), 'ok'] })
    const result = await retryAccessTokenRestore(ctx.deps)
    assert(result.notice === 'unavailable' && ctx.calls.refresh === 1, 'retry button: single attempt, keeps ②')
    assert(ctx.calls.wait === 0, 'retry button: no silent retry')
  }
  {
    const ctx = createCtx({ refreshResults: [new SessionInvalidError('401')] })
    const result = await retryAccessTokenRestore(ctx.deps)
    assert(result.notice === 'session-ended', 'retry button: session invalid → ①')
  }
  {
    const ctx = createCtx({ credential: false })
    const result = await retryAccessTokenRestore(ctx.deps)
    assert(result.notice === null && ctx.calls.refresh === 0, 'retry after other-tab logout → close')
  }

  // ── 렌더 대기 ──
  assert((await waitForAuthBootstrap(Promise.resolve(), 50)) === 'settled', 'wait settles')
  assert(
    (await waitForAuthBootstrap(Promise.reject(new Error('x')), 50)) === 'settled',
    'rejected bootstrap still renders',
  )
  assert(
    (await waitForAuthBootstrap(new Promise(() => {}), 20)) === 'timeout',
    'slow bootstrap → timeout',
  )

  console.log('auth-bootstrap selfcheck ok')
}

void main().catch(error => {
  console.error(error)
  process.exit(1)
})
