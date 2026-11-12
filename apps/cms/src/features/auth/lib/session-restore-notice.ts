/**
 * 새로고침 세션 복원 실패 안내 (QA-0137 access token 메모리 전용 전환).
 * 새로고침 전에 로그인돼 있던 경우(저장된 사용자 + refresh 수단)에만 쓴다.
 * 비로그인·직접 로그아웃·다른 탭 로그아웃에는 띄우지 않는다.
 */

/** ① 세션이 끝남(refresh 거절) — 로그인 화면에서 확인 버튼만 있는 공통 Alert */
export const SESSION_ENDED_NOTICE = {
  title: '로그인이 종료되었어요.',
  content: '로그인 유지 시간이 지났거나 로그아웃되어 다시 로그인이 필요해요.',
} as const

/** ② 네트워크·서버 오류로 확인하지 못함 — 복원 로딩 화면 위 닫기·다시 시도 */
export const SESSION_RESTORE_NETWORK_FAILURE_NOTICE = {
  title: '로그인 정보를 확인하지 못했어요.',
  content: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  cancelLabel: '닫기',
  retryLabel: '다시 시도',
} as const

/**
 * 새로고침 복원 refresh가 이 시간 안에 끝나지 않으면 ② 안내를 띄운다 (화면 기준일 뿐, 요청은 끊지 않고 계속 기다린다).
 * 늦게 성공하면 안내를 닫고 이어가고, 늦게 400·401·403이면 ①로 바꾼다.
 */
export const RELOAD_RESTORE_NOTICE_DELAY_MS = 3_000
/** 실제 실패(네트워크·5xx 등) 뒤 조용한 재시도 전 대기 — 화면 기준 시간 초과로는 재시도하지 않는다 */
export const RELOAD_RESTORE_SILENT_RETRY_DELAY_MS = 500

/** 로그아웃 뒤 전체 이동(window.location.assign)을 지나 로그인 화면까지 안내를 넘기는 표시 (토큰 아님) */
export const SESSION_ENDED_NOTICE_STORAGE_KEY = 'cms_session_ended_notice'

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function markSessionEndedNotice(): void {
  try {
    getSessionStorage()?.setItem(SESSION_ENDED_NOTICE_STORAGE_KEY, '1')
  } catch {
    // 저장소가 막혀 있으면 안내 없이 로그인 화면으로만 간다
  }
}

/** 표시가 있으면 지우고 true — 로그인 화면이 한 번만 띄운다 */
export function consumeSessionEndedNotice(): boolean {
  const storage = getSessionStorage()
  if (!storage) return false
  try {
    if (storage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY) !== '1') return false
    storage.removeItem(SESSION_ENDED_NOTICE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
