const NO_RETRY_HTTP_STATUSES = new Set([400, 401, 403, 404, 409, 422])

/** Axios 등 `error.response.status`만 읽는다. 없으면 undefined. */
export function getQueryRetryHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error == null || !('response' in error)) return undefined
  const status = (error as { response?: { status?: unknown } }).response?.status
  return typeof status === 'number' ? status : undefined
}

/** 4xx(검증·인증·없음)는 재시도하지 않는다. 그 외 최대 2회. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = getQueryRetryHttpStatus(error)
  if (status != null && NO_RETRY_HTTP_STATUSES.has(status)) return false
  return failureCount < 2
}

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 10_000)
}
