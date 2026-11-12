/**
 * QA-0137 새로고침 세션 복원 — refresh 실패 분류 (Platform·CMS와 같은 기준).
 *
 * - session-invalid: 400·401·403, 그리고 다시 보낼 새 값이 없는 409 REFRESH_TOKEN_ALREADY_ROTATED. 세션을 되살릴 수 없다 → 로컬 로그아웃 후 로그인 화면에서 "로그인이 종료되었어요." 안내.
 * - transient: 그 밖의 전부 (404·다른 409 등 4xx, 응답 형식 오류, 네트워크, 5xx, 요청 시간 초과).
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

/** 서버가 이미 rotate한 refresh token을 받았다는 409 코드 */
export const REFRESH_TOKEN_ALREADY_ROTATED = 'REFRESH_TOKEN_ALREADY_ROTATED'

/** 오류 응답 본문의 code (`{ error: { code } }` 또는 `{ code }`) */
export function readRefreshErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { error?: { code?: unknown }; code?: unknown }
  if (record.error && typeof record.error === 'object' && typeof record.error.code === 'string') {
    return record.error.code
  }
  return typeof record.code === 'string' && record.code.trim() ? record.code : undefined
}

/** 409 REFRESH_TOKEN_ALREADY_ROTATED인지 */
export function isRefreshAlreadyRotatedError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 409 &&
    readRefreshErrorCode(error.response?.data) === REFRESH_TOKEN_ALREADY_ROTATED
  )
}

/**
 * 409 REFRESH_TOKEN_ALREADY_ROTATED도 session-invalid — 다시 보낼 새 값이 없어 여기까지 왔다
 * (axios-instance가 새 값이 있으면 이미 재시도함). 같은 값을 10초 뒤 다시 보내면 서버 재사용 탐지로
 * 계정 전체 세션이 폐기되므로 [다시 시도] 대상이 아니다.
 */
export function classifyRefreshFailure(error: unknown): RefreshFailureKind {
  if (isRefreshAlreadyRotatedError(error)) return 'session-invalid'
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status != null && SESSION_INVALID_STATUSES.has(status)) return 'session-invalid'
  }
  return 'transient'
}
