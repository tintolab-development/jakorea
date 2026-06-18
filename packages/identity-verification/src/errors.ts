export class IdentityVerificationApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'IdentityVerificationApiError'
    this.code = code
  }
}

export function parseIdentityVerificationApiError(payload: unknown): IdentityVerificationApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const rawMessage = typeof o.message === 'string' ? o.message : undefined
    const code =
      wrapped?.code ??
      (typeof o.code === 'string' ? o.code : rawMessage?.split(':')[0]?.trim() ?? 'UNKNOWN')
    const message =
      wrapped?.message ?? rawMessage ?? '본인인증 요청에 실패했습니다.'
    return new IdentityVerificationApiError(String(code), message)
  }
  return new IdentityVerificationApiError('UNKNOWN', '본인인증 요청에 실패했습니다.')
}
