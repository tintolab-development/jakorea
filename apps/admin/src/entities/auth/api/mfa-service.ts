/**
 * MFA TOTP provisioning · verify (실 API)
 */

import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'
import type { OtpVerifyResponse, TotpProvisioning } from '@/entities/auth/model/types'
import {
  fetchAdminMfaEnrollment,
  fetchAdminMfaVerify,
} from '@/features/auth/api/admin-auth-fetcher'
import type { AuthTokenResponse } from '@/features/auth/model/admin-login-api.types'
import { ADMIN_MFA_METHOD, isAdminLocalTestMfa } from '@/shared/constants/mfa-policy'
import { TOTP_ISSUER } from '@/shared/constants/totp'

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
  const resolvedUri = otpauthUri ?? generateURI({ issuer: TOTP_ISSUER, label: email, secret })
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

export async function getTotpProvisioning(
  email: string,
  options?: GetTotpProvisioningOptions
): Promise<TotpProvisioning | null> {
  if (!options?.challengeUuid) {
    throw new Error('MFA challenge가 없습니다. 로그인부터 다시 시도하세요.')
  }

  try {
    return await getRemoteTotpProvisioning(email, options.challengeUuid, options)
  } catch (error) {
    if (isAdminLocalTestMfa(options.mfaMethod)) {
      return null
    }
    throw error
  }
}

export async function verifyTotp(
  _email: string,
  otpCode: string,
  options?: { challengeUuid?: string }
): Promise<OtpVerifyResponse & { tokens?: AuthTokenResponse }> {
  if (!options?.challengeUuid) {
    return {
      success: false,
      detail: 'MFA challenge가 없습니다. 로그인부터 다시 시도하세요.',
      verified: false,
      failedAttempts: 0,
      isLocked: false,
      lockUntil: null,
    }
  }

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
