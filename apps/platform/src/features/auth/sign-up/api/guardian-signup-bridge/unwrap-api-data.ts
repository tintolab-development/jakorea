export class GuardianSignupBridgeApiError extends Error {
  readonly code: string
  readonly httpStatus?: number

  constructor(code: string, message: string, httpStatus?: number) {
    super(message)
    this.name = 'GuardianSignupBridgeApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

function parseApiError(payload: unknown, httpStatus?: number): GuardianSignupBridgeApiError {
  if (payload && typeof payload === 'object') {
    const record = payload as {
      message?: unknown
      error?: { code?: unknown; message?: unknown }
    }
    const code =
      typeof record.error?.code === 'string' ? record.error.code : 'UNKNOWN'
    const message =
      (typeof record.error?.message === 'string' && record.error.message.trim()) ||
      (typeof record.message === 'string' && record.message.trim()) ||
      '요청을 처리할 수 없습니다.'
    return new GuardianSignupBridgeApiError(code, message, httpStatus)
  }
  return new GuardianSignupBridgeApiError('UNKNOWN', '요청을 처리할 수 없습니다.', httpStatus)
}

export function unwrapSignupBridgeApiData<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    throw new GuardianSignupBridgeApiError('UNKNOWN', '응답을 해석할 수 없습니다.')
  }
  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as T
  }
  return o as T
}

export function rethrowSignupBridgeApiError(
  error: unknown,
  fallbackMessage: string,
): never {
  if (error instanceof GuardianSignupBridgeApiError) {
    throw error
  }
  const axiosErr = error as { response?: { data?: unknown; status?: number } }
  if (axiosErr.response?.data) {
    throw parseApiError(axiosErr.response.data, axiosErr.response.status)
  }
  if (error instanceof Error && error.message.trim()) {
    throw new GuardianSignupBridgeApiError('UNKNOWN', error.message.trim())
  }
  throw new GuardianSignupBridgeApiError('UNKNOWN', fallbackMessage)
}
