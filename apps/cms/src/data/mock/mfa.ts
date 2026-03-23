/**
 * MFA Mock 데이터
 * Phase 0.5.1: MFA/OTP UX
 */

import type { MfaState } from '@/types/mfa'

/**
 * Mock MFA 상태 생성 (TOTP / Microsoft Authenticator)
 */
export function createTotpMfaState(_userId: string, accountLabel: string): MfaState {
  return {
    method: 'totp',
    isRequired: true,
    isVerified: false,
    accountLabel,
    lastSentAt: null,
    failedAttempts: 0,
    isLocked: false,
    lockUntil: null,
  }
}

/**
 * Mock OTP 생성 (SMS Mock — 휴대폰 로그인용)
 * 실제로는 백엔드에서 SMS로 발송
 */
export function generateMockOtp(): string {
  return '123456'
}

/**
 * Mock OTP 검증 (SMS Mock)
 */
export function verifyMockOtp(otp: string, expectedOtp: string = '123456'): boolean {
  return otp === expectedOtp || otp === '000000'
}
