/**
 * 인증 API 서비스 (Mock)
 * Phase 4.1.1: 사용자 인증 시스템
 */

import type { LoginRequest, LoginResponse, User } from '@/types/user'
import type { MfaState } from '@/types/mfa'
import { fetchAdminLogin } from '@/features/auth/api/admin-login-fetcher'
import type { AdminMfaChallengeResponse } from '@/features/auth/model/admin-login-api.types'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { readAccessTokenFromMemory } from '@/features/auth/lib/access-token-memory'

export type LoginMode = 'api'

export interface LoginOptions {
  mode?: LoginMode
}
import { SocialAccountNotLinkedError } from '@/features/auth/errors/social-account-not-linked-error'

/** 실 API 세션 토큰 접두사 — `validateToken`·auth-store 갱신 시 mock JWT 와 구분 */
export const CMS_REMOTE_SESSION_PREFIX = 'cms-remote-'

/** MFA 완료 후 저장된 실 JWT(accessToken) 여부 — mock·pending 세션 제외 */
export function hasRemoteAdminJwt(): boolean {
  if (typeof window === 'undefined') return false
  const token = readAccessTokenFromMemory()
  if (!token || token.startsWith('mock-jwt-token-') || token.startsWith(CMS_REMOTE_SESSION_PREFIX)) {
    return false
  }
  return token.split('.').length >= 3
}

/** 실 API 관리자 세션 — 쿠키/Bearer·opaque·cms-remote 플레이스홀더 포함. mock JWT만 제외 */
export function hasRemoteAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  const token = readAccessTokenFromMemory()
  if (!token || token.startsWith('mock-jwt-token-')) {
    return false
  }
  return true
}

/** DEV 우회·mock credential 로그인 세션 (`mock-jwt-token-…`) */
export function isMockAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  const token = readAccessTokenFromMemory()
  return Boolean(token?.startsWith('mock-jwt-token-'))
}

function buildPendingAdminUser(email: string): Omit<User, 'password'> {
  return {
    id: `pending-admin-${email}`,
    email,
    name: email.split('@')[0] ?? '관리자',
    role: 'ADMIN',
    isActive: true,
    createdAt: null,
    updatedAt: null,
    programRoles: {},
  }
}

function buildMfaStateFromChallenge(
  email: string,
  challenge: AdminMfaChallengeResponse
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
    mfaSetupRequired: challenge.mfaSetupRequired,
  }
}

async function loginWithRemoteApi(
  request: LoginRequest
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  if (!isRemoteApiConfigured()) {
    throw new Error(
      'API 서버가 설정되지 않았습니다. `.env`에 `VITE_API_SERVER` 또는 `VITE_API_BASE_URL`을 설정하세요.'
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

/**
 * 로그인 API — adminAuth remote only
 */
export async function login(
  request: LoginRequest,
  _options?: LoginOptions
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  void _options
  return loginWithRemoteApi(request)
}

/**
 * 토큰 검증
 */
export async function validateToken(token: string): Promise<Omit<User, 'password'> | null> {
  await new Promise(resolve => setTimeout(resolve, 100))

  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('auth_user')
  if (!userStr) return null

  let user: Omit<User, 'password'> | null = null
  try {
    user = JSON.parse(userStr) as Omit<User, 'password'>
  } catch {
    return null
  }

  if (!user?.isActive) return null

  // 실 JWT(accessToken) — mock 접두사가 아니면 localStorage 사용자 신뢰
  if (!token.startsWith('mock-jwt-token-') && !token.startsWith(CMS_REMOTE_SESSION_PREFIX)) {
    return user
  }

  if (token.startsWith(CMS_REMOTE_SESSION_PREFIX)) {
    return user
  }

  if (token.startsWith('mock-jwt-token-')) {
    return user
  }

  return null
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<Omit<User, 'password'> | null> {
  // access token은 메모리에만 있다 (QA-0137)
  if (typeof window === 'undefined') {
    return null
  }

  const token = readAccessTokenFromMemory()
  if (!token) {
    return null
  }

  return validateToken(token)
}

/**
 * 소셜 로그인 제공자 타입
 * Phase 0.1.3: 간편인증 로그인
 */
export type SocialProvider = 'kakao' | 'naver' | 'google'

/** UI·메시지용 제공자 표시 이름 */
export const SOCIAL_PROVIDER_LABEL: Record<SocialProvider, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: '구글',
}

/**
 * 소셜 로그인용 Mock 매핑 테이블 (소셜 ID → User ID)
 * Phase 0.1.3: 간편인증 로그인
 */
void new Map<string, string>()

/**
 * 휴대폰 본인인증 로그인
 * Phase 0.1.3: 휴대폰 본인인증 로그인
 * @param phoneNumber 전화번호
 * @param _otpCode OTP 인증번호 (검증은 이미 완료된 상태)
 */
export async function loginWithPhone(
  _phoneNumber: string,
  _otpCode: string
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  void _phoneNumber
  void _otpCode
  throw new Error('휴대폰 로그인 API가 연동되지 않았습니다.')
}

/**
 * 소셜 로그인
 * Phase 0.1.3: 간편인증 로그인
 * @param provider 소셜 제공자 (kakao/naver/google)
 * @param socialToken 소셜 토큰 (Mock)
 */
export async function loginWithSocial(
  _provider: SocialProvider,
  _socialToken: string
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  void _provider
  void _socialToken
  throw new SocialAccountNotLinkedError()
}
