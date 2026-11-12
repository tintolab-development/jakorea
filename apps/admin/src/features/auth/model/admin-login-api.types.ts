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
  /** true면 QR 등록, false면 기존 인증 앱 코드만 입력 */
  mfaSetupRequired?: boolean
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

/** POST /api/admin/auth/mfa/verify · refresh 200 */
export interface AuthTokenResponse {
  accessToken: string
  /**
   * QA-0137 전환기에만 본문에 온다. 운영 `JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false`면 없고 HttpOnly 쿠키로만 받는다.
   * TODO(QA-0137 인프라 전환 후 삭제): 필드 제거.
   */
  refreshToken?: string
  tokenType?: string
  expiresInSeconds?: number
  /** 관리자 발급 임시 비밀번호 변경 필요 */
  passwordChangeRequired?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  registeredByAdmin?: boolean
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
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
