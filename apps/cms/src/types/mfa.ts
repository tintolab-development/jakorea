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
  /** 실패 시도 횟수 */
  failedAttempts: number
  /** 잠금 여부 */
  isLocked: boolean
  /** 잠금 해제 시간 */
  lockUntil: string | null
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
}

/** TOTP 검증 요청 (이메일로 Mock 시크릿 조회) */
export interface TotpVerifyRequest {
  email: string
  otpCode: string
}
