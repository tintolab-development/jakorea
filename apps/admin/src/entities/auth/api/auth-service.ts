/**
 * Homepage Admin 인증 서비스
 * CMS `/api/admin/auth/login` → MFA challenge
 */

import type { LoginRequest, LoginResponse, AuthUser, MfaState } from '@/entities/auth/model/types'
import { fetchAdminLogin } from '@/features/auth/api/admin-login-fetcher'
import type { AdminMfaChallengeResponse } from '@/features/auth/model/admin-login-api.types'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/** MFA 진행 중 pending 세션 접두사 (실 JWT와 구분) */
export const HP_REMOTE_SESSION_PREFIX = 'hp-remote-'

/** MFA 완료 후 받은 실 JWT 여부 — mock·pending 제외. access token은 메모리에만 있으므로 값을 받아 판단한다. */
export function hasRemoteAdminJwt(token: string | null | undefined): boolean {
  if (!token || token.startsWith('mock-jwt-token-') || token.startsWith(HP_REMOTE_SESSION_PREFIX)) {
    return false
  }
  return token.split('.').length >= 3
}

function buildPendingAdminUser(email: string): AuthUser {
  const now = new Date().toISOString()
  return {
    id: `pending-admin-${email}`,
    email,
    name: email.split('@')[0] ?? '관리자',
    role: 'ADMIN',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  }
}

function buildMfaStateFromChallenge(
  email: string,
  challenge: AdminMfaChallengeResponse,
): MfaState {
  return {
    method: 'totp',
    isRequired: true,
    isVerified: false,
    accountLabel: email,
    lastSentAt: null,
    failedAttempts: 0,
    isLocked: false,
    lockUntil: null,
    challengeUuid: challenge.challengeUuid,
    mfaMethod: challenge.mfaMethod,
    mfaSetupRequired: challenge.mfaSetupRequired,
    challengeExpiresAt: challenge.expiresAt,
    totpSecret: challenge.totpSecret,
    otpauthUri: challenge.otpauthUri,
    qrDataUrl: challenge.qrDataUrl,
  }
}

async function loginWithRemoteApi(
  request: LoginRequest,
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  if (!isRemoteApiConfigured()) {
    throw new Error(
      'API 서버가 설정되지 않았습니다. `.env`에 `VITE_API_SERVER` 또는 `VITE_API_BASE_URL`을 설정하세요.',
    )
  }

  const challenge = await fetchAdminLogin(request)
  const user = buildPendingAdminUser(request.email)
  const mfaState = buildMfaStateFromChallenge(request.email, challenge)

  return {
    user,
    token: '',
    expiresAt: challenge.expiresAt,
    requiresMfa: true,
    mfaState,
  }
}

export async function login(
  request: LoginRequest,
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  return loginWithRemoteApi(request)
}
