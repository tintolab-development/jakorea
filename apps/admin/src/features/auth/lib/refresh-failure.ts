/**
 * QA-0137 새로고침 세션 복원 — refresh 실패 분류 (Platform·CMS와 같은 기준).
 *
 * - session-invalid: 400·401·403만. 세션을 되살릴 수 없다 → 로컬 로그아웃 후 로그인 화면에서 "로그인이 종료되었어요." 안내.
 * - transient: 그 밖의 전부 (404·409 등 다른 4xx, 응답 형식 오류, 네트워크, 5xx, 요청 시간 초과).
 *   로그아웃하지 않고 "로그인 정보를 확인하지 못했어요." 재시도 안내로 보낸다.
 */
import axios from 'axios'

export type RefreshFailureKind = 'session-invalid' | 'transient'

export type RefreshSessionResult = { ok: true } | { ok: false; kind: RefreshFailureKind }

const SESSION_INVALID_STATUSES = new Set([400, 401, 403])

/**
 * 새로고침 복원 refresh가 이 시간 안에 끝나지 않으면 로딩 화면 위에 재시도 안내를 먼저 띄운다.
 * 화면 기준일 뿐 요청은 중단하지 않는다 (전역 axios timeout 그대로).
 */
export const BOOTSTRAP_REFRESH_NOTICE_DELAY_MS = 3_000
/** 실제 실패(일시 오류) 응답 뒤 조용한 재시도까지 간격 — 화면 기준 시간 초과는 재시도하지 않는다 */
export const BOOTSTRAP_REFRESH_RETRY_DELAY_MS = 500

export function classifyRefreshFailure(error: unknown): RefreshFailureKind {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status != null && SESSION_INVALID_STATUSES.has(status)) return 'session-invalid'
  }
  return 'transient'
}
