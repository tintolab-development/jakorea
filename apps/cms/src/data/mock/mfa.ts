/**
 * MFA Mock 데이터
 * Phase 0.5.1: MFA/OTP UX
 */

import type { MfaState } from '@/types/mfa'

/**
 * Mock MFA 상태 생성
 */
export function createMockMfaState(_userId: string, phoneNumber: string): MfaState {
  return {
    isRequired: true,
    isVerified: false,
    phoneNumber: maskPhoneNumber(phoneNumber),
    lastSentAt: new Date().toISOString(),
    failedAttempts: 0,
    isLocked: false,
    lockUntil: null,
  }
}

/**
 * 전화번호 마스킹 (010-****-1234)
 */
function maskPhoneNumber(phone: string): string {
  // 010-1234-5678 형식 처리
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`
  }
  // 010-123-4567 형식 처리
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Mock OTP 생성 (테스트용)
 * 실제로는 백엔드에서 SMS로 발송
 */
export function generateMockOtp(): string {
  // 테스트용 고정 OTP (실제로는 랜덤)
  return '123456'
}

/**
 * Mock OTP 검증
 */
export function verifyMockOtp(otp: string, expectedOtp: string = '123456'): boolean {
  // 테스트용: '123456' 또는 '000000' 허용
  return otp === expectedOtp || otp === '000000'
}
