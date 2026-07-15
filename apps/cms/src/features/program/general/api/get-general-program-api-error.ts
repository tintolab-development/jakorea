/**
 * 일반 프로그램 API 에러 메시지 추출 · CONFLICT 한글화
 */

const BUSINESS_START_LOCK_PATTERN =
  /business_start_date|schedule lock|only be modified before/i

export function getGeneralProgramApiErrorMessage(error: unknown, fallback: string): string {
  const raw = extractRawApiMessage(error)
  if (raw && BUSINESS_START_LOCK_PATTERN.test(raw)) {
    return '사업 시작일이 지난 프로그램은 수정할 수 없습니다. 사업일 이전에만 정보 수정이 가능합니다.'
  }
  if (raw?.trim()) {
    // CONFLICT: prefix 제거
    return raw.replace(/^CONFLICT:\s*/i, '').trim() || fallback
  }
  return fallback
}

function extractRawApiMessage(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as {
      response?: { status?: number; data?: unknown }
    }
    const data = axiosErr.response?.data
    if (data && typeof data === 'object') {
      if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
        return (data as { message: string }).message
      }
      if (
        'error' in data &&
        (data as { error?: unknown }).error &&
        typeof (data as { error: unknown }).error === 'object' &&
        'message' in ((data as { error: object }).error as object)
      ) {
        const nested = (data as { error: { message?: unknown } }).error.message
        if (typeof nested === 'string') return nested
      }
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return undefined
}
