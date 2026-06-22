/**
 * 인증 API 서비스 (Mock)
 * Phase 4.1.1: 사용자 인증 시스템
 */

import type { LoginRequest, LoginResponse, User } from '@/types/user'
import type { MfaState } from '@/types/mfa'
import { fetchAdminLogin } from '@/features/auth/api/admin-login-fetcher'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/** 로그인 화면에서 명시적으로 선택하는 경로 (미지정 시 `VITE_REAL_API_MODULES` 규칙) */
export type LoginMode = 'mock' | 'api'

export interface LoginOptions {
  mode?: LoginMode
}
import { validateLogin, getUserByPhone, mockUsers } from '@/data/mock/users'
import { createTotpMfaState } from '@/data/mock/mfa'
import { SocialAccountNotLinkedError } from '@/features/auth/errors/social-account-not-linked-error'
import { AdminLoginApprovalPendingError } from '@/features/auth/errors/admin-login-approval-pending-error'

/** 실 API 세션 토큰 접두사 — `validateToken`·auth-store 갱신 시 mock JWT 와 구분 */
export const CMS_REMOTE_SESSION_PREFIX = 'cms-remote-'

/** MFA 완료 후 저장된 실 JWT(accessToken) 여부 — mock·pending 세션 제외 */
export function hasRemoteAdminJwt(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('auth_token')
  if (!token || token.startsWith('mock-jwt-token-') || token.startsWith(CMS_REMOTE_SESSION_PREFIX)) {
    return false
  }
  return token.split('.').length >= 3
}

function buildPendingAdminUser(email: string): Omit<User, 'password'> {
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
    programRoles: {},
  }
}

function buildMfaStateFromChallenge(
  email: string,
  challenge: { challengeUuid: string; mfaMethod: string; expiresAt: string }
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

async function loginWithMock(
  request: LoginRequest
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  if (import.meta.env.DEV) {
    console.info('[CMS auth] Mock 로그인 — 브라우저 Network 에는 요청이 없습니다.')
  }

  await new Promise(resolve => setTimeout(resolve, 500))

  const user = validateLogin(request.email, request.password)

  if (!user) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  if (user.role === 'ADMIN' && user.permissionApprovalStatus === 'PENDING') {
    throw new AdminLoginApprovalPendingError()
  }

  const requiresMfa = user.role === 'ADMIN'
  let mfaState: MfaState | undefined

  if (requiresMfa) {
    mfaState = createTotpMfaState(user.id, user.email)
  }

  const token = `mock-jwt-token-${user.id}-${Date.now()}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user

  return {
    user: {
      ...userWithoutPassword,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token,
    expiresAt,
    requiresMfa,
    mfaState,
  }
}

/**
 * 로그인 API
 * Phase 0.5.1: MFA 지원 추가
 * - `options.mode === 'api'`: 실 `fetchAdminLogin` (원격 URL 필요)
 * - `options.mode === 'mock'`: mock(`validateLogin` + MFA)
 * - 미지정: `VITE_REAL_API_MODULES`에 `adminAuth`가 있을 때만 실 API
 */
export async function login(
  request: LoginRequest,
  options?: LoginOptions
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  if (options?.mode === 'api') {
    return loginWithRemoteApi(request)
  }

  if (options?.mode === 'mock') {
    return loginWithMock(request)
  }

  if (isRealApiModuleEnabled('adminAuth')) {
    return loginWithRemoteApi(request)
  }

  return loginWithMock(request)
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

  const match = token.match(/mock-jwt-token-(.+?)-/)
  if (!match) {
    return null
  }

  const userId = match[1]
  const mockUser = mockUsers.find(u => u.id === userId)

  if (!mockUser || !mockUser.isActive) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = mockUser
  return userWithoutPassword
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<Omit<User, 'password'> | null> {
  // Mock: localStorage에서 토큰 가져오기
  if (typeof window === 'undefined') {
    return null
  }

  const token = localStorage.getItem('auth_token')
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
const socialUserMap = new Map<string, string>()

/**
 * 휴대폰 본인인증 로그인
 * Phase 0.1.3: 휴대폰 본인인증 로그인
 * @param phoneNumber 전화번호
 * @param _otpCode OTP 인증번호 (검증은 이미 완료된 상태)
 */
export async function loginWithPhone(
  phoneNumber: string,
  _otpCode: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  // Mock: 실제 API 호출 대신 지연 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500))

  // 전화번호로 사용자 찾기
  const user = getUserByPhone(phoneNumber)

  if (!user) {
    throw new Error('등록된 전화번호가 아닙니다.')
  }

  // OTP 검증은 이미 완료된 상태로 가정 (실제로는 별도 검증 필요)
  // 여기서는 전화번호로 사용자를 찾았으면 OTP 검증이 완료된 것으로 간주

  // 관리자는 MFA 필요
  const requiresMfa = user.role === 'ADMIN'
  let mfaState: MfaState | undefined

  if (requiresMfa) {
    mfaState = createTotpMfaState(user.id, user.email)
  }

  // Mock JWT 토큰 생성
  const token = `mock-jwt-token-${user.id}-${Date.now()}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후

  // password를 제외한 전체 user 객체 반환 (adminLevel 포함)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user

  return {
    user: {
      ...userWithoutPassword,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token,
    expiresAt,
    requiresMfa,
    mfaState,
  }
}

/**
 * 소셜 로그인
 * Phase 0.1.3: 간편인증 로그인
 * @param provider 소셜 제공자 (kakao/naver/google)
 * @param socialToken 소셜 토큰 (Mock)
 */
export async function loginWithSocial(
  provider: SocialProvider,
  socialToken: string
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  // Mock: 실제 API 호출 대신 지연 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500))

  // Mock: 소셜 토큰에서 사용자 ID 추출 (실제로는 백엔드에서 처리)
  // 여기서는 소셜 ID를 기반으로 기존 사용자 매칭 또는 새 사용자 생성
  const socialId = `${provider}-${socialToken}`

  // 기존 매핑 확인
  const userId = socialUserMap.get(socialId)

  if (!userId) {
    throw new SocialAccountNotLinkedError()
  }

  const user = mockUsers.find(u => u.id === userId)

  if (!user || !user.isActive) {
    throw new Error('소셜 로그인에 실패했습니다.')
  }

  // 관리자는 MFA 필요
  const requiresMfa = user.role === 'ADMIN'
  let mfaState: MfaState | undefined

  if (requiresMfa) {
    mfaState = createTotpMfaState(user.id, user.email)
  }

  // Mock JWT 토큰 생성
  const token = `mock-jwt-token-${user.id}-${Date.now()}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후

  // password를 제외한 전체 user 객체 반환 (adminLevel 포함)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user

  return {
    user: {
      ...userWithoutPassword,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token,
    expiresAt,
    requiresMfa,
    mfaState,
  }
}
