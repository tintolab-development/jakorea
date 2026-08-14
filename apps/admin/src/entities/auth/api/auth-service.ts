/**
 * Homepage Admin 인증 서비스
 * - mock: 로컬 테스트 계정 + mock JWT (MFA 없음)
 * - api: CMS `/api/admin/auth/login` → MFA challenge
 */

import type { LoginRequest, LoginResponse, AuthUser, MfaState } from '@/entities/auth/model/types'
import { fetchAdminLogin } from '@/features/auth/api/admin-login-fetcher'
import type { AdminMfaChallengeResponse } from '@/features/auth/model/admin-login-api.types'
import { AUTH_TOKEN_KEY } from '@/features/auth/model/auth-storage'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

export type LoginMode = 'mock' | 'api'

export interface LoginOptions {
  mode?: LoginMode
}

/** MFA 진행 중 pending 세션 접두사 (실 JWT와 구분) */
export const HP_REMOTE_SESSION_PREFIX = 'hp-remote-'

const MOCK_ACCOUNTS: Array<{ email: string; password: string; name: string }> = [
  { email: 'admin1@jakorea.org', password: 'admin1234!', name: '관리자' },
  { email: '123@jakorea.org', password: '!Tinto05270527', name: '가입관리자' },
]

/** MFA 완료 후 저장된 실 JWT 여부 — mock·pending 제외 */
export function hasRemoteAdminJwt(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token || token.startsWith('mock-jwt-token-') || token.startsWith(HP_REMOTE_SESSION_PREFIX)) {
    return false
  }
  return token.split('.').length >= 3
}

export function isMockAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return Boolean(token?.startsWith('mock-jwt-token-'))
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

function buildMockAdminUser(email: string, name: string): AuthUser {
  const now = new Date().toISOString()
  return {
    id: `mock-admin-${email}`,
    email,
    name,
    role: 'ADMIN',
    adminLevel: 'MASTER',
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
    challengeExpiresAt: challenge.expiresAt,
    totpSecret: challenge.totpSecret,
    otpauthUri: challenge.otpauthUri,
    qrDataUrl: challenge.qrDataUrl,
  }
}

async function loginWithMock(
  request: LoginRequest,
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  const matched = MOCK_ACCOUNTS.find(
    account =>
      account.email.toLowerCase() === request.email.trim().toLowerCase() &&
      account.password === request.password,
  )
  if (!matched) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  const user = buildMockAdminUser(matched.email, matched.name)
  const token = `mock-jwt-token-${user.id}-${Date.now()}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  return {
    user,
    token,
    expiresAt,
    requiresMfa: false,
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
  options?: LoginOptions,
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  if (options?.mode === 'mock') {
    return loginWithMock(request)
  }
  return loginWithRemoteApi(request)
}
