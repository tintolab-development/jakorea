/**
 * MFA 관련 타입 정의
 * Phase 0.5.1: MFA/OTP UX
 */

/**
 * MFA 상태
 */
export interface MfaState {
  /** MFA 필요 여부 */
  isRequired: boolean
  /** 인증 완료 여부 */
  isVerified: boolean
  /** 마스킹된 전화번호 (010-****-1234) */
  phoneNumber: string
  /** 마지막 OTP 발송 시간 */
  lastSentAt: string | null
  /** 실패 시도 횟수 */
  failedAttempts: number
  /** 잠금 여부 */
  isLocked: boolean
  /** 잠금 해제 시간 */
  lockUntil: string | null
}

/**
 * OTP 발송 요청
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
  message: string
  sentAt: string
  expiresAt: string
}

/**
 * OTP 검증 요청
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
  message: string
  verified: boolean
  failedAttempts: number
  isLocked: boolean
  lockUntil: string | null
}
