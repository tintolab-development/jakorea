/**
 * 관리자 인증 API 계약 (OpenAPI AuthTokenResponse / RefreshTokenRequest)
 * - POST `/api/admin/auth/login` → MFA challenge
 * - POST `/api/admin/auth/mfa/enrollment` → TOTP 등록·QR provisioning
 * - POST `/api/admin/auth/mfa/verify` → AuthTokenResponse
 * - POST `/api/admin/auth/refresh` → AuthTokenResponse (body: RefreshTokenRequest)
 * - POST `/api/admin/auth/logout` → RefreshTokenRequest (access 만료여도 revoke 가능)
 */

export interface AdminLoginRequestBody {
  email: string
  password: string
}

/** POST /api/admin/auth/login 200 */
export interface AdminMfaChallengeResponse {
  requiresMfa?: boolean
  challengeUuid: string
  mfaMethod: string
  expiresAt: string
  /** 최초 TOTP 등록 시 백엔드가 challenge에 함께 내려줄 수 있음 (OpenAPI 미반영 필드 허용) */
  totpSecret?: string
  otpauthUri?: string
  qrDataUrl?: string
}

/** POST /api/admin/auth/mfa/enrollment */
export interface AdminMfaSetupRequestBody {
  mfaMethod: string
  enabled: boolean
  totpSecret?: string
  backupCodesHashJson?: string
  /** 로그인 직후 challenge 기반 등록 시 전달 (OpenAPI 미반영 필드 허용) */
  challengeUuid?: string
}

/** POST /api/admin/auth/mfa/enrollment 200 — 문서 외 provisioning 필드 허용 */
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
  refreshToken: string
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

/** 일부 실패 응답 래퍼 */
export interface AdminAuthFailureResponse {
  success: false
  data?: null
  message?: string
  error?: AdminLoginErrorBody
}
