/**
 * MFA 관련 타입 정의
 * Phase 0.5.1: MFA/OTP UX
 * TOTP: Microsoft Authenticator 등 표준 앱 (RFC 6238)
 */

/** 관리자 2단계 인증 방식 */
export type MfaMethod = 'totp'

/**
 * MFA 상태
 */
export interface MfaState {
  method: MfaMethod
  /** MFA 필요 여부 */
  isRequired: boolean
  /** 인증 완료 여부 */
  isVerified: boolean
  /** 표시용 계정(이메일 등) */
  accountLabel: string
  /** 마지막 OTP 발송 시간 — TOTP에서는 미사용(null) */
  lastSentAt: string | null
  /** 실패 시도 횟수 — 실 API는 challenge 응답 `failedAttemptCount`(서버 누적값) */
  failedAttempts: number
  /** 잠금 전까지 허용되는 연속 실패 횟수 — 실 API challenge 응답 `maxFailedAttempts` */
  maxFailedAttempts?: number
  /** 잠금 여부 */
  isLocked: boolean
  /** 잠금 해제 시간 */
  lockUntil: string | null
  /** 실 API MFA challenge (adminAuth) */
  challengeUuid?: string
  mfaMethod?: string
  challengeExpiresAt?: string
  /** true면 QR 등록, false면 기존 authenticator OTP만 입력 */
  mfaSetupRequired?: boolean
}

/** TOTP 등록/QR 프로비저닝 결과 (Mock) */
export interface TotpProvisioning {
  otpauthUri: string
  qrDataUrl: string
  manualSecret: string
}

/**
 * OTP 발송 요청 (SMS Mock — 휴대폰 로그인/본인인증용)
 */
export interface OtpSendRequest {
  userId: string
  phoneNumber: string
}

/**
 * OTP 발송 응답
 */
export interface OtpSendResponse {
  success: boolean
  detail: string
  sentAt: string
  expiresAt: string
}

/**
 * OTP 검증 요청 (SMS Mock)
 */
export interface OtpVerifyRequest {
  userId: string
  otpCode: string
}

/**
 * OTP 검증 응답
 */
export interface OtpVerifyResponse {
  success: boolean
  detail: string
  verified: boolean
  failedAttempts: number
  isLocked: boolean
  lockUntil: string | null
  /** BE AuthException code (예: MFA_VERIFICATION_FAILED, ACCOUNT_LOCKED) */
  errorCode?: string
  /** 401 MFA_VERIFICATION_FAILED `error.details.failedAttemptCount`(서버 누적값). 숫자로 읽지 못하면 없음 */
  serverFailedAttemptCount?: number
  /** 401 MFA_VERIFICATION_FAILED `error.details.maxFailedAttempts` */
  serverMaxFailedAttempts?: number
}

/** TOTP 검증 요청 (이메일로 Mock 시크릿 조회 · 실 API는 challengeUuid) */
export interface TotpVerifyRequest {
  email: string
  otpCode: string
  challengeUuid?: string
}
