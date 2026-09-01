export interface AdminSelfSignupRequest {
  email: string
  password: string
  name: string
  phone?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  birthDate?: string
  requestedRoleCode?: string
  identityVerificationSessionUuid: string
  termsVersion: string
  termsAgreed: boolean
  privacyAgreed: boolean
  mfaSetupAgreed: boolean
}

export interface AdminSelfSignupResponse {
  adminId?: number
  email?: string
  status?: string
  requestedRoleCode?: string
  loginEnabled?: boolean
  nextStep?: string
  createdAt?: string
}

export class AdminRegisterApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AdminRegisterApiError'
    this.code = code
  }
}

export function parseAdminRegisterApiError(payload: unknown): AdminRegisterApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const rawMessage = typeof o.message === 'string' ? o.message : undefined
    const code =
      wrapped?.code ??
      (typeof o.code === 'string' ? o.code : rawMessage?.split(':')[0]?.trim() ?? 'UNKNOWN')
    const message =
      wrapped?.message ??
      rawMessage ??
      '회원가입에 실패했습니다.'
    return new AdminRegisterApiError(String(code), message)
  }
  return new AdminRegisterApiError('UNKNOWN', '회원가입에 실패했습니다.')
}
