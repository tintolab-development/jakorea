/**
 * QA-0137: 새로고침·새 탭 시작 시 로그인 복원 실패 안내 상태.
 * 복원 전에 로그인돼 있던 사용자(refresh 수단이 있던 경우)에게만 띄운다. 비로그인·직접 로그아웃·다른 탭 로그아웃에는 띄우지 않는다.
 *
 * node selfcheck에서 그대로 돌도록 `@/` 별칭 import를 쓰지 않는다.
 */

/**
 * session-ended: 시작 시 복원에서 서버가 세션 무효를 확정(401/400/403)
 * unavailable: 네트워크·5xx·timeout으로 확인 못 함
 * session-expired: 사용 중 세션이 끝남 — 지금 화면에 머문 채 안내하고 [확인] 때 로그아웃한다 (showSessionExpiredNotice)
 */
export type AuthRestoreNotice = 'session-ended' | 'unavailable' | 'session-expired'

export type AuthRestoreNoticeAction = 'close' | 'sign-in' | 'confirm' | 'retry'

const SIGN_IN_PATH = '/auth/sign-in'
/** 로그인 필요 가드가 보내는 화면 — 이미 로그인 안내 중이므로 [확인]만 둔다 */
const LOGIN_PROMPT_PATHS = [SIGN_IN_PATH, '/auth/required'] as const

let notice: AuthRestoreNotice | null = null
/** session-expired 안내를 [확인]으로 닫을 때 실행할 로그아웃 */
let onSessionExpiredConfirm: (() => void) | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function getAuthRestoreNotice(): AuthRestoreNotice | null {
  return notice
}

export function subscribeAuthRestoreNotice(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function showAuthRestoreNotice(next: AuthRestoreNotice): void {
  if (notice === next) return
  // 사용 중 세션 종료 안내는 사용자가 [확인]할 때까지 다른 안내로 바꾸지 않는다
  if (notice === 'session-expired') return
  notice = next
  emit()
}

/**
 * 사용 중 세션 종료: 지금 화면에 머문 채 「자동으로 로그아웃되었어요.」를 띄우고, [확인] 때 onConfirm(로그아웃·이동)을 실행한다.
 * 여러 요청·경로가 동시에 알려도 안내는 하나, onConfirm도 처음 것 한 번만 실행한다.
 */
export function showSessionExpiredNotice(onConfirm: () => void): void {
  if (notice === 'session-expired') return
  onSessionExpiredConfirm = onConfirm
  notice = 'session-expired'
  emit()
}

/** 사용 중 세션 종료 안내가 떠 있고 [확인]을 기다리는 중인지 (이 동안 refresh·Activity를 다시 시도하지 않는다) */
export function isSessionExpiredNoticePending(): boolean {
  return notice === 'session-expired'
}

/**
 * 코드에서 안내를 닫는다. only를 주면 그 안내일 때만 닫는다 (예: 로그아웃 시 '확인 못 함' 안내만 닫기).
 * session-expired를 여기서 닫으면(예: 다른 탭 재로그인으로 새 토큰을 받음) 로그아웃은 실행하지 않는다.
 */
export function dismissAuthRestoreNotice(only?: AuthRestoreNotice): void {
  if (notice == null) return
  if (only && notice !== only) return
  onSessionExpiredConfirm = null
  notice = null
  emit()
}

/** 사용자가 안내 버튼([확인]·[닫기]·[로그인])으로 닫는다. session-expired면 등록된 로그아웃을 실행한다 */
export function confirmAuthRestoreNotice(): void {
  if (notice == null) return
  const confirmSessionExpired = notice === 'session-expired' ? onSessionExpiredConfirm : null
  onSessionExpiredConfirm = null
  notice = null
  emit()
  confirmSessionExpired?.()
}

function isLoginPromptPath(pathname: string): boolean {
  return LOGIN_PROMPT_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

/** 안내별 버튼. 로그인 화면·로그인 필요 화면에서는 세션 종료 안내를 [확인]만 둔다 */
export function resolveAuthRestoreNoticeActions(
  kind: AuthRestoreNotice,
  pathname: string,
): AuthRestoreNoticeAction[] {
  if (kind === 'unavailable') return ['close', 'retry']
  if (kind === 'session-expired') return ['confirm']
  if (isLoginPromptPath(pathname)) return ['confirm']
  return ['close', 'sign-in']
}

/** 기존 로그인 유도와 같은 `redirect` 규칙으로 현재 위치를 넘긴다 */
export function buildSignInPathWithRedirect(currentPath: string): string {
  const path = currentPath && currentPath.startsWith('/') ? currentPath : '/'
  return `${SIGN_IN_PATH}?redirect=${encodeURIComponent(path)}`
}

/** selfcheck 전용 */
export function resetAuthRestoreNoticeForTest(): void {
  notice = null
  onSessionExpiredConfirm = null
  listeners.clear()
}
