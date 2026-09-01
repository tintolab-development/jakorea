/**
 * Homepage Admin 인증 도메인 타입 (CMS admin auth 계약에 맞춤)
 */

export type AdminRole = 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: AdminRole
  isActive: boolean
  adminLevel?: 'MASTER' | 'GENERAL'
  profileImageUrl?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
  expiresAt: string
  requiresMfa?: boolean
  mfaState?: MfaState
}

export type MfaMethod = 'totp'

export interface MfaState {
  method: MfaMethod
  isRequired: boolean
  isVerified: boolean
  accountLabel: string
  lastSentAt: string | null
  failedAttempts: number
  isLocked: boolean
  lockUntil: string | null
  challengeUuid?: string
  mfaMethod?: string
  challengeExpiresAt?: string
  totpSecret?: string
  otpauthUri?: string
  qrDataUrl?: string
}

export interface TotpProvisioning {
  otpauthUri: string
  qrDataUrl: string
  manualSecret: string
}

export interface OtpVerifyResponse {
  success: boolean
  detail: string
  verified: boolean
  failedAttempts: number
  isLocked: boolean
  lockUntil: string | null
}
