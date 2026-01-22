/**
 * MFA API 서비스 (Mock)
 * Phase 0.5.1: MFA/OTP UX
 */

import type { OtpSendRequest, OtpSendResponse, OtpVerifyRequest, OtpVerifyResponse } from '@/types/mfa'
import { OTP_POLICY } from '@/shared/constants/mfa-policy'
import { generateMockOtp, verifyMockOtp } from '@/data/mock/mfa'

// Mock: 사용자별 OTP 저장 (실제로는 백엔드에서 관리)
const userOtpMap = new Map<string, { otp: string; expiresAt: string }>()

// Mock: 사용자별 일일 발송 횟수 추적 (실제로는 백엔드에서 관리)
const dailySendCountMap = new Map<string, { count: number; date: string }>()

/**
 * 일일 발송 횟수 확인 및 증가
 */
function checkAndIncrementDailyCount(userId: string): boolean {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const userCount = dailySendCountMap.get(userId)

  if (!userCount || userCount.date !== today) {
    // 오늘 첫 발송
    dailySendCountMap.set(userId, { count: 1, date: today })
    return true
  }

  if (userCount.count >= OTP_POLICY.maxDailyAttempts) {
    // 일일 발송 제한 초과
    return false
  }

  // 발송 횟수 증가
  dailySendCountMap.set(userId, { count: userCount.count + 1, date: today })
  return true
}

/**
 * OTP 발송
 */
export async function sendOtp(request: OtpSendRequest): Promise<OtpSendResponse> {
  // Mock: 실제 SMS 발송 대신 지연 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 일일 발송 제한 체크
  if (!checkAndIncrementDailyCount(request.userId)) {
    return {
      success: false,
      message: `일일 인증번호 발송 제한(${OTP_POLICY.maxDailyAttempts}회)을 초과했습니다. 내일 다시 시도해주세요.`,
      sentAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    }
  }

  // Mock OTP 생성
  const otp = generateMockOtp()
  const expiresAt = new Date(Date.now() + OTP_POLICY.validitySeconds * 1000).toISOString()

  // Mock 저장 (실제로는 백엔드에서 관리)
  userOtpMap.set(request.userId, { otp, expiresAt })

  // 콘솔에 OTP 출력 (개발용)
  console.log(`[MFA Mock] OTP for ${request.userId}: ${otp} (expires at ${expiresAt})`)

  return {
    success: true,
    message: '인증번호가 발송되었습니다.',
    sentAt: new Date().toISOString(),
    expiresAt,
  }
}

/**
 * OTP 검증
 */
export async function verifyOtp(request: OtpVerifyRequest): Promise<OtpVerifyResponse> {
  // Mock: 실제 검증 대신 지연 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500))

  const storedOtp = userOtpMap.get(request.userId)

  if (!storedOtp) {
    return {
      success: false,
      message: '인증번호가 발송되지 않았습니다.',
      verified: false,
      failedAttempts: 0,
      isLocked: false,
      lockUntil: null,
    }
  }

  // 만료 확인
  if (new Date(storedOtp.expiresAt) < new Date()) {
    userOtpMap.delete(request.userId)
    return {
      success: false,
      message: '인증번호가 만료되었습니다. 다시 발송해주세요.',
      verified: false,
      failedAttempts: 0,
      isLocked: false,
      lockUntil: null,
    }
  }

  // OTP 검증
  console.log('[MFA Service] Verifying OTP', {
    userId: request.userId,
    inputOtp: request.otpCode,
    storedOtp: storedOtp.otp,
  })
  
  const isValid = verifyMockOtp(request.otpCode, storedOtp.otp)
  
  console.log('[MFA Service] OTP verification result', { isValid })

  if (isValid) {
    // 성공 시 저장된 OTP 삭제
    userOtpMap.delete(request.userId)
    return {
      success: true,
      message: '인증이 완료되었습니다.',
      verified: true,
      failedAttempts: 0,
      isLocked: false,
      lockUntil: null,
    }
  }

  // 실패 시 실패 횟수 증가 (실제로는 백엔드에서 관리)
  return {
    success: false,
    message: '인증번호가 올바르지 않습니다.',
    verified: false,
    failedAttempts: 1, // Mock: 실제로는 백엔드에서 관리
    isLocked: false,
    lockUntil: null,
  }
}
