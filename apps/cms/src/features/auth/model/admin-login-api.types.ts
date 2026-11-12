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

/** POST /api/admin/auth/login 200. QR/Secret은 포함하지 않는다. */
export interface AdminMfaChallengeResponse {
  requiresMfa?: boolean
  challengeUuid: string
  mfaMethod: string
  expiresAt: string
  /** true면 QR 등록, false면 기존 OTP만 입력 */
  mfaSetupRequired?: boolean
}

/** POST /api/admin/auth/mfa/enrollment — Secret은 서버가 만든다. */
export interface AdminMfaSetupRequestBody {
  challengeUuid: string
  mfaMethod: string
  qrSize?: number
}

/** POST /api/admin/auth/mfa/enrollment 200 */
export interface AdminMfaSetupResult {
  adminAccountId?: number
  adminId?: number
  mfaMethod?: string
  enabled?: boolean
  message?: string
  mfaSetupRequired?: boolean
  /** 화면 메모리에만 둔다. 저장소·로그에 남기지 않는다. */
  manualEntryKey?: string
  qrDataUrl?: string
}

export interface AdminMfaVerifyRequestBody {
  challengeUuid: string
  verificationCode: string
}

/** POST /api/admin/auth/mfa/verify · refresh 200 */
export interface AuthTokenResponse {
  accessToken: string
  /** QA-0137: 전환기에만 본문에 온다. 없으면 HttpOnly 쿠키(`JA_ADMIN_RT`)로만 refresh */
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
  /** QA-0137: 선택. 생략하면 서버가 HttpOnly refresh 쿠키를 쓴다 */
  refreshToken?: string
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
