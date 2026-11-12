/**
 * QA-0137: 새로고침·새 탭 시작 시 로그인 복원 실패 안내 상태.
 * 복원 전에 로그인돼 있던 사용자(refresh 수단이 있던 경우)에게만 띄운다. 비로그인·직접 로그아웃·다른 탭 로그아웃에는 띄우지 않는다.
 *
 * node selfcheck에서 그대로 돌도록 `@/` 별칭 import를 쓰지 않는다.
 */

/** session-ended: 서버가 세션 무효를 확정(401/400/403) · unavailable: 네트워크·5xx·timeout으로 확인 못 함 */
export type AuthRestoreNotice = 'session-ended' | 'unavailable'

export type AuthRestoreNoticeAction = 'close' | 'sign-in' | 'confirm' | 'retry'

const SIGN_IN_PATH = '/auth/sign-in'
/** 로그인 필요 가드가 보내는 화면 — 이미 로그인 안내 중이므로 [확인]만 둔다 */
const LOGIN_PROMPT_PATHS = [SIGN_IN_PATH, '/auth/required'] as const

let notice: AuthRestoreNotice | null = null
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
  notice = next
  emit()
}

/** only를 주면 그 안내일 때만 닫는다 (예: 로그아웃 시 '확인 못 함' 안내만 닫기) */
export function dismissAuthRestoreNotice(only?: AuthRestoreNotice): void {
  if (notice == null) return
  if (only && notice !== only) return
  notice = null
  emit()
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
  listeners.clear()
}
