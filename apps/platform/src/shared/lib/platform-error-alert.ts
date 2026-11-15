import { PLATFORM_ALERT_COPY, type PlatformAlertCopy } from './platform-alert-copy.ts'

/**
 * 오류 → Platform 공통 안내 팝업 문구 (Figma 「오류 제한 팝업」 14491-2533).
 *
 * - 응답이 없는 오류(연결 끊김·시간 초과·502/503/504 빈 응답) → 「네트워크 오류 안내」
 * - 429 → 「공통 제한 안내 / 처리 제한」
 * - 그 밖의 실패 → 「공통 제한 안내 / 처리 실패」
 *   서버가 보낸 업무 메시지(예: 이미 신청한 프로그램)가 있으면 설명 자리에 그대로 쓴다.
 *
 * 화면마다 실패 문구를 따로 만들지 않는다. 팝업이 아닌 인라인 문구는 이 함수의 대상이 아니다.
 * axios를 직접 import하지 않는다(셀프체크를 node로 돌리기 위해 모양으로 판별).
 */

type ErrorLike = {
  isAxiosError?: boolean
  code?: unknown
  name?: unknown
  message?: unknown
  status?: unknown
  response?: { status?: unknown; data?: unknown } | null
  cause?: unknown
  originalError?: unknown
}

const NETWORK_ERROR_CODES = new Set(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET'])
const GATEWAY_STATUSES = new Set([502, 503, 504])
const MAX_CAUSE_DEPTH = 4

function asErrorLike(value: unknown): ErrorLike | null {
  return value != null && typeof value === 'object' ? (value as ErrorLike) : null
}

/** error 자신과 cause·originalError 사슬 (래핑된 오류도 판별) */
function errorChain(error: unknown): ErrorLike[] {
  const chain: ErrorLike[] = []
  let current: unknown = error
  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    const like = asErrorLike(current)
    if (!like || chain.includes(like)) break
    chain.push(like)
    current = like.cause ?? like.originalError
  }
  return chain
}

function readStatus(like: ErrorLike): number | null {
  const status = like.response?.status ?? like.status
  return typeof status === 'number' ? status : null
}

function hasResponseBody(like: ErrorLike): boolean {
  const data = like.response?.data
  if (data == null) return false
  if (typeof data === 'string') return data.trim().length > 0
  return true
}

function isCanceled(like: ErrorLike): boolean {
  return like.code === 'ERR_CANCELED' || like.name === 'CanceledError' || like.name === 'AbortError'
}

function isNetworkLike(like: ErrorLike): boolean {
  if (isCanceled(like)) return false
  if (typeof like.code === 'string' && NETWORK_ERROR_CODES.has(like.code)) return true
  if (like.isAxiosError === true && like.response == null) return true
  // fetch 연결 실패 (Chrome 'Failed to fetch', Safari 'Load failed', Firefox 'NetworkError …')
  if (
    like.name === 'TypeError' &&
    typeof like.message === 'string' &&
    /failed to fetch|load failed|networkerror/i.test(like.message)
  ) {
    return true
  }
  const status = readStatus(like)
  return status != null && GATEWAY_STATUSES.has(status) && !hasResponseBody(like)
}

/** 서버 응답 없이 끝난 오류인지 (네트워크 오류 안내 대상) */
export function isPlatformNetworkError(error: unknown): boolean {
  return errorChain(error).some(isNetworkLike)
}

/** 짧은 시간 요청 반복으로 막힌 오류인지 (HTTP 429) */
export function isPlatformRateLimitedError(error: unknown): boolean {
  return errorChain(error).some(like => readStatus(like) === 429)
}

/** 「처리 실패」 — 서버 업무 메시지가 있으면 설명에 쓴다 */
export function buildRequestFailedAlertCopy(serverMessage?: string | null): PlatformAlertCopy {
  const message = serverMessage?.trim()
  if (!message) return PLATFORM_ALERT_COPY.requestFailed
  return { title: PLATFORM_ALERT_COPY.requestFailed.title, description: message }
}

export type ResolvePlatformErrorAlertOptions = {
  /**
   * 서버가 보낸 업무 메시지를 꺼내는 함수. FE 기본 문구(fallback)는 돌려주지 말고 빈 값을 돌려준다.
   * 기존 `getXxxApiErrorMessage(error, fallback)`류는 fallback에 ''를 넘겨 쓴다.
   */
  serverMessage?: (error: unknown) => string | null | undefined
}

/** 오류 팝업 제목·설명 */
export function resolvePlatformErrorAlert(
  error: unknown,
  options: ResolvePlatformErrorAlertOptions = {},
): PlatformAlertCopy {
  if (isPlatformNetworkError(error)) return PLATFORM_ALERT_COPY.networkError
  if (isPlatformRateLimitedError(error)) return PLATFORM_ALERT_COPY.rateLimited
  return buildRequestFailedAlertCopy(options.serverMessage?.(error))
}
