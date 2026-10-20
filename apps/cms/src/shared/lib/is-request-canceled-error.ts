/** axios abort / TanStack Query queryFn signal 취소 — 사용자-facing Alert 제외 */
export function isRequestCanceledError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const candidate = error as { code?: string; name?: string; message?: string }
  return (
    candidate.code === 'ERR_CANCELED' ||
    candidate.name === 'AbortError' ||
    candidate.name === 'CanceledError' ||
    candidate.message === 'Request aborted' ||
    candidate.message === 'canceled'
  )
}
