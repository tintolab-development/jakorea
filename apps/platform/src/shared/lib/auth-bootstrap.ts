/**
 * QA-0137: 새로고침·새 탭 시작 시 메모리 access token 복원.
 * access token은 브라우저 저장소에 없으므로, refresh 수단(저장 refreshToken 또는 HttpOnly 쿠키 세션 표시)이 있으면
 * 1) 열려 있는 다른 탭에서 받고 2) 없으면 refresh(탭 간 lock 안에서) 한다.
 * 화면 첫 렌더 전에 끝내야 렌더 시점에 `getAccessToken()`을 읽는 조회·가드가 그대로 동작한다.
 *
 * 실패 처리 (복원 전에 로그인돼 있던 사용자에게만 안내):
 * - 서버가 세션 무효를 확정(401/400/403): 로컬 로그아웃 후 'session-ended' 안내
 * - 네트워크·5xx·timeout: 로그아웃하지 않고 조용히 1회 재시도, 그래도 실패하면 'unavailable' 안내
 * - 실패 사이 다른 탭이 로그인(메모리 토큰 수신)하거나 로그아웃(refresh 수단 제거)했으면 안내하지 않는다
 *
 * node selfcheck에서 그대로 돌도록 의존성은 주입받고 `@/` 별칭 import를 쓰지 않는다.
 */
import type { AuthRestoreNotice } from './auth-restore-notice'

export type AuthRestoreFailureKind = 'session-invalid' | 'unavailable'

export type AuthBootstrapDeps = {
  getAccessToken: () => string | null
  hasRefreshCredential: () => boolean
  /** 다른 탭에 요청. 없거나 timeout이면 null */
  requestPeerAccessToken: () => Promise<string | null>
  /** refresh 1회 (탭 내 single-flight + 탭 간 lock). 실패 시 throw */
  refresh: () => Promise<string>
  /** 실패 분류 — 서버가 인증 무효를 확정했으면 session-invalid, 네트워크·5xx·timeout은 unavailable */
  classifyFailure: (error: unknown) => AuthRestoreFailureKind
  /** 세션 무효 확정 시 기존 로그아웃 경로로 로컬 세션을 정리한다 */
  onSessionInvalid: (error: unknown) => Promise<void> | void
  /** 조용한 재시도 전 대기 (ms) */
  retryDelayMs?: number
  wait?: (ms: number) => Promise<void>
}

export type AuthBootstrapStatus =
  /** 이미 메모리에 토큰이 있다 (또는 그 사이 다른 탭이 알려 줬다) */
  | 'already-authenticated'
  /** refresh 수단이 없다 — 비로그인(또는 그 사이 다른 탭이 로그아웃) */
  | 'no-credential'
  /** 다른 탭에서 받았다 */
  | 'peer'
  /** refresh로 새로 받았다 */
  | 'refreshed'
  /** 서버가 세션 무효를 확정해 로컬 세션을 정리했다 */
  | 'logged-out'
  /** 네트워크·5xx 등 — refresh 수단은 남기고 비로그인 상태로 둔다 */
  | 'failed'

export type AuthBootstrapResult = {
  status: AuthBootstrapStatus
  /** 띄울 안내. 비로그인·다른 탭 로그인/로그아웃이면 null */
  notice: AuthRestoreNotice | null
}

const done = (status: AuthBootstrapStatus): AuthBootstrapResult => ({ status, notice: null })

function defaultWait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** refresh 실패 뒤 그 사이 다른 탭이 로그인·로그아웃했는지 본다 */
function resolveChangedElsewhere(deps: AuthBootstrapDeps): AuthBootstrapResult | null {
  if (deps.getAccessToken()) return done('already-authenticated')
  if (!deps.hasRefreshCredential()) return done('no-credential')
  return null
}

async function handleSessionInvalid(
  deps: AuthBootstrapDeps,
  error: unknown,
): Promise<AuthBootstrapResult> {
  await deps.onSessionInvalid(error)
  // 정리 사이 다른 탭이 새로 로그인해 알려 줬으면 안내하지 않는다.
  if (deps.getAccessToken()) return done('already-authenticated')
  return { status: 'logged-out', notice: 'session-ended' }
}

/** refresh 시도 (attempts회까지, unavailable일 때만 다음 시도) */
async function refreshWithRetry(
  deps: AuthBootstrapDeps,
  attempts: number,
): Promise<AuthBootstrapResult> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await deps.refresh()
      return done('refreshed')
    } catch (error) {
      if (deps.classifyFailure(error) === 'session-invalid') {
        return handleSessionInvalid(deps, error)
      }
      const changed = resolveChangedElsewhere(deps)
      if (changed) return changed
      if (attempt >= attempts) return { status: 'failed', notice: 'unavailable' }
      await (deps.wait ?? defaultWait)(deps.retryDelayMs ?? 0)
      const changedWhileWaiting = resolveChangedElsewhere(deps)
      if (changedWhileWaiting) return changedWhileWaiting
    }
  }
}

/** 시작 시 복원. 네트워크·5xx는 조용히 1회 재시도한다 */
export async function bootstrapAccessToken(deps: AuthBootstrapDeps): Promise<AuthBootstrapResult> {
  if (deps.getAccessToken()) return done('already-authenticated')
  // 비로그인 사용자는 요청도 안내도 하지 않는다.
  if (!deps.hasRefreshCredential()) return done('no-credential')

  const peerToken = await deps.requestPeerAccessToken()
  if (peerToken && deps.getAccessToken()) return done('peer')

  return refreshWithRetry(deps, 2)
}

/** 안내 모달 [다시 시도] — refresh 1회 */
export async function retryAccessTokenRestore(
  deps: AuthBootstrapDeps,
): Promise<AuthBootstrapResult> {
  const changed = resolveChangedElsewhere(deps)
  if (changed) return changed
  return refreshWithRetry(deps, 1)
}

/**
 * 첫 렌더 대기. bootstrap이 timeout보다 오래 걸리면 렌더를 막지 않는다(토큰은 도착하면 메모리에 들어간다).
 * 대기 중 예외는 렌더를 막지 않도록 삼킨다.
 */
export function waitForAuthBootstrap(
  bootstrap: Promise<unknown>,
  timeoutMs: number,
): Promise<'settled' | 'timeout'> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve('timeout'), timeoutMs)
    bootstrap.then(
      () => {
        clearTimeout(timer)
        resolve('settled')
      },
      () => {
        clearTimeout(timer)
        resolve('settled')
      },
    )
  })
}
