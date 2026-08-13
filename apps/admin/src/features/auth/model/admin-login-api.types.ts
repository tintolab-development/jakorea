/**
 * 관리자 인증 API 계약 (CMS Swagger v9와 동일)
 */

export interface AdminLoginRequestBody {
  email: string
  password: string
}

export interface AdminMfaChallengeResponse {
  requiresMfa?: boolean
  challengeUuid: string
  mfaMethod: string
  expiresAt: string
  totpSecret?: string
  otpauthUri?: string
  qrDataUrl?: string
}

export interface AdminMfaSetupRequestBody {
  mfaMethod: string
  enabled: boolean
  totpSecret?: string
  backupCodesHashJson?: string
  challengeUuid?: string
}

export interface AdminMfaSetupResult {
  adminId?: number
  mfaMethod?: string
  enabled?: boolean
  message?: string
  totpSecret?: string
  otpauthUri?: string
  qrDataUrl?: string
}

export interface AdminMfaVerifyRequestBody {
  challengeUuid: string
  verificationCode: string
}

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresInSeconds?: number
}

export interface RefreshTokenRequestBody {
  refreshToken: string
}

export interface AdminLoginErrorBody {
  code: string
  message: string
}

export interface AdminAuthFailureResponse {
  success: false
  data?: null
  message?: string
  error?: AdminLoginErrorBody
}
