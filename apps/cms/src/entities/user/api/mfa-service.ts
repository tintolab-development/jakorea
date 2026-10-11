/**
 * MFA API 서비스 (Mock)
 * Phase 0.5.1: MFA/OTP UX
 */

import type {
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  TotpProvisioning } from '@/types/mfa'
import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'
import { TOTP_ISSUER } from '@/shared/constants/totp'
import {
  ADMIN_MFA_METHOD,
  isAdminLocalTestMfa,
  OTP_POLICY,
} from '@/shared/constants/mfa-policy'
import { fetchAdminMfaEnrollment, fetchAdminMfaVerify, AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import type { AuthTokenResponse } from '@/features/auth/model/admin-login-api.types'

// Mock: 사용자별 OTP 저장 (실제로는 백엔드에서 관리)
void new Map<string, { otp: string; expiresAt: string }>()

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

export interface GetTotpProvisioningOptions {
  challengeUuid?: string
  mfaMethod?: string
  totpSecret?: string
  otpauthUri?: string
  qrDataUrl?: string
}

const TOTP_QR_SIZE = 220

async function buildTotpProvisioningFromSecret(
  email: string,
  secret: string,
  otpauthUri?: string
): Promise<TotpProvisioning> {
  const resolvedUri =
    otpauthUri ?? generateURI({ issuer: TOTP_ISSUER, label: email, secret })
  // 백엔드 qrDataUrl은 여백·해상도가 제각각일 수 있어 URI 기준으로 항상 220×220 재생성
  const resolvedQr = await QRCode.toDataURL(resolvedUri, {
    margin: 0,
    width: TOTP_QR_SIZE,
  })

  return {
    otpauthUri: resolvedUri,
    qrDataUrl: resolvedQr,
    manualSecret: secret,
  }
}

async function getRemoteTotpProvisioning(
  email: string,
  challengeUuid: string,
  preset?: Pick<GetTotpProvisioningOptions, 'totpSecret' | 'otpauthUri' | 'qrDataUrl'>
): Promise<TotpProvisioning> {
  if (preset?.totpSecret || preset?.otpauthUri) {
    const secret = preset.totpSecret ?? generateSecret()
    return buildTotpProvisioningFromSecret(email, secret, preset.otpauthUri)
  }

  // otpauthUri 없이 이미지만 온 경우 — 재생성 불가, 원본 사용(표시 크기는 CSS)
  if (preset?.qrDataUrl) {
    return {
      otpauthUri: '',
      qrDataUrl: preset.qrDataUrl,
      manualSecret: '',
    }
  }

  let setupResult = await fetchAdminMfaEnrollment({
    mfaMethod: ADMIN_MFA_METHOD.TOTP,
    enabled: true,
    challengeUuid,
  })

  let secret = setupResult.totpSecret
  if (!secret) {
    secret = generateSecret()
    setupResult = await fetchAdminMfaEnrollment({
      mfaMethod: ADMIN_MFA_METHOD.TOTP,
      enabled: true,
      challengeUuid,
      totpSecret: secret,
    })
    secret = setupResult.totpSecret ?? secret
  }

  return buildTotpProvisioningFromSecret(email, secret, setupResult.otpauthUri)
}

/** Microsoft Authenticator 등 표준 앱용 TOTP QR·수동 키 */
export async function getTotpProvisioning(
  email: string,
  options?: GetTotpProvisioningOptions
): Promise<TotpProvisioning | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  if (options?.challengeUuid) {
    try {
      return await getRemoteTotpProvisioning(email, options.challengeUuid, options)
    } catch (error) {
      if (isAdminLocalTestMfa(options.mfaMethod)) {
        return null
      }
      throw error
    }
  }

  throw new Error('MFA challengeUuid 없이 TOTP provisioning을 조회할 수 없습니다.')
}

/** TOTP 6자리 검증 — challengeUuid 있으면 실 API mfa/verify (API 로그인) */
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
