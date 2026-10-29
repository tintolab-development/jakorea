export class MemberGuardianVerificationApiError extends Error {
  readonly code: string
  readonly httpStatus?: number

  constructor(code: string, message: string, httpStatus?: number) {
    super(message)
    this.name = 'MemberGuardianVerificationApiError'
    this.httpStatus = httpStatus
    this.code = code
  }
}

export function parseMemberGuardianVerificationApiError(
  payload: unknown,
  httpStatus?: number,
): MemberGuardianVerificationApiError {
  if (payload && typeof payload === 'object') {
    const record = payload as {
      message?: unknown
      error?: { code?: unknown; message?: unknown }
    }
    const code = typeof record.error?.code === 'string' ? record.error.code : 'UNKNOWN'
    const message =
      (typeof record.error?.message === 'string' && record.error.message.trim()) ||
      (typeof record.message === 'string' && record.message.trim()) ||
      '요청을 처리할 수 없습니다.'
    return new MemberGuardianVerificationApiError(code, message, httpStatus)
  }
  return new MemberGuardianVerificationApiError('UNKNOWN', '요청을 처리할 수 없습니다.', httpStatus)
}
