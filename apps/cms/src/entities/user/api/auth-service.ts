/**
 * 인증 API 서비스 (Mock)
 * Phase 4.1.1: 사용자 인증 시스템
 */

import type { LoginRequest, LoginResponse, User } from '@/types/user'
import type { MfaState } from '@/types/mfa'
import { validateLogin, getUserByPhone } from '@/data/mock/users'
import { createTotpMfaState } from '@/data/mock/mfa'

/**
 * 로그인 API
 * Phase 0.5.1: MFA 지원 추가
 */
export async function login(
  request: LoginRequest
): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
  // Mock: 실제 API 호출 대신 지연 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500))

  const user = validateLogin(request.email, request.password)

  if (!user) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  // 관리자는 MFA 필요
  const requiresMfa = user.role === 'ADMIN'
  let mfaState: MfaState | undefined

  if (requiresMfa) {
    mfaState = createTotpMfaState(user.id, user.email)
  }

  // Mock JWT 토큰 생성 (MFA 완료 전에는 임시 토큰)
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
 * 토큰 검증
 */
export async function validateToken(token: string): Promise<Omit<User, 'password'> | null> {
  // Mock: 토큰에서 사용자 ID 추출
  await new Promise(resolve => setTimeout(resolve, 100))

  const match = token.match(/mock-jwt-token-(.+?)-/)
  if (!match) {
    return null
  }

  const userId = match[1]
  const user = mockUsers.find(u => u.id === userId)

  if (!user || !user.isActive) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
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

// Mock users import
import { mockUsers } from '@/data/mock/users'

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
  let userId = socialUserMap.get(socialId)

  if (!userId) {
    // 새 사용자 생성 또는 기존 사용자 매칭 (Mock)
    // 여기서는 첫 번째 개인 사용자를 매칭 (실제로는 소셜 정보로 사용자 찾기)
    const existingUser = mockUsers.find(u => u.role === 'INDIVIDUAL' && u.isActive)

    if (existingUser) {
      userId = existingUser.id
      socialUserMap.set(socialId, userId)
    } else {
      throw new Error('소셜 로그인에 실패했습니다. 계정이 없습니다.')
    }
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
