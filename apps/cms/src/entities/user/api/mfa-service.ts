/**
 * MFA API 서비스
 * Phase 0.5.1: MFA/OTP UX
 */

import type {
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  TotpProvisioning,
} from '@/types/mfa'
import { isAdminLocalTestMfa, OTP_POLICY } from '@/shared/constants/mfa-policy'
import {
  fetchAdminMfaEnrollment,
  fetchAdminMfaVerify,
  AdminMfaApiError,
} from '@/features/auth/api/admin-auth-fetcher'
import { buildAdminMfaEnrollmentRequest } from '@/features/auth/lib/admin-mfa-contract'
import type { AuthTokenResponse } from '@/features/auth/model/admin-login-api.types'

export interface GetTotpProvisioningOptions {
  challengeUuid?: string
  mfaMethod?: string
}

async function getRemoteTotpProvisioning(challengeUuid: string): Promise<TotpProvisioning> {
  const setupResult = await fetchAdminMfaEnrollment(buildAdminMfaEnrollmentRequest(challengeUuid))
  return {
    otpauthUri: '',
    qrDataUrl: setupResult.qrDataUrl ?? '',
    manualSecret: setupResult.manualEntryKey ?? '',
  }
}

/** 첫 등록 challenge의 pending QR. 기등록 계정은 호출하지 않는다. */
export async function getTotpProvisioning(
  _email: string,
  options?: GetTotpProvisioningOptions
): Promise<TotpProvisioning | null> {
  void _email
  if (isAdminLocalTestMfa(options?.mfaMethod)) return null
  if (!options?.challengeUuid) {
    throw new Error('MFA challengeUuid 없이 TOTP provisioning을 조회할 수 없습니다.')
  }
  return getRemoteTotpProvisioning(options.challengeUuid)
}

/** TOTP 6자리 검증 — challengeUuid 있으면 실 API mfa/verify */
export async function verifyTotp(
  _email: string,
  otpCode: string,
  options?: { challengeUuid?: string }
): Promise<OtpVerifyResponse & { tokens?: AuthTokenResponse }> {
  if (options?.challengeUuid) {
    try {
      const tokens = await fetchAdminMfaVerify({
        challengeUuid: options.challengeUuid,
        verificationCode: otpCode,
      })
      return {
        success: true,
        detail: '인증이 완료되었습니다.',
        verified: true,
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
        tokens,
      }
    } catch (error) {
      if (error instanceof AdminMfaApiError) {
        const locked = error.code === 'ACCOUNT_LOCKED'
        return {
          success: false,
          detail: error.message,
          verified: false,
          failedAttempts: locked ? OTP_POLICY.maxFailedAttempts : 1,
          isLocked: locked,
          lockUntil: null,
          errorCode: error.code,
        }
      }
      const message = error instanceof Error ? error.message : 'MFA 인증에 실패했습니다.'
      return {
        success: false,
        detail: message,
        verified: false,
        failedAttempts: 1,
        isLocked: false,
        lockUntil: null,
      }
    }
  }

  return {
    success: false,
    detail: 'MFA challengeUuid가 필요합니다.',
    verified: false,
    failedAttempts: 0,
    isLocked: false,
    lockUntil: null,
  }
}

/**
 * OTP 발송
 */
export async function sendOtp(_request: OtpSendRequest): Promise<OtpSendResponse> {
  void _request
  throw new Error('SMS OTP 발송 API가 연동되지 않았습니다.')
}

/**
 * OTP 검증
 */
export async function verifyOtp(_request: OtpVerifyRequest): Promise<OtpVerifyResponse> {
  void _request
  throw new Error('SMS OTP 검증 API가 연동되지 않았습니다.')
}
