/**
 * 인증 API 서비스 (Mock)
 * Phase 4.1.1: 사용자 인증 시스템
 */

import type { LoginRequest, LoginResponse, User } from '@/types/user'
import type { MfaState } from '@/types/mfa'
import { validateLogin } from '@/data/mock/users'
import { createMockMfaState } from '@/data/mock/mfa'

/**
 * 로그인 API
 * Phase 0.5.1: MFA 지원 추가
 */
export async function login(request: LoginRequest): Promise<LoginResponse & { requiresMfa?: boolean; mfaState?: MfaState }> {
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
    const phoneNumber = user.phone || '010-1234-5678'
    mfaState = createMockMfaState(user.id, phoneNumber)
  }

  // Mock JWT 토큰 생성 (MFA 완료 전에는 임시 토큰)
  const token = `mock-jwt-token-${user.id}-${Date.now()}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      instructorId: user.instructorId,
      interviewStatus: user.interviewStatus,
      interviewScheduledAt: user.interviewScheduledAt,
      interviewCompletedAt: user.interviewCompletedAt,
      participationHistory: user.participationHistory,
      isActive: user.isActive,
      lastLoginAt: new Date().toISOString(),
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString(),
      phone: user.phone,
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

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    instructorId: user.instructorId,
    interviewStatus: user.interviewStatus,
    interviewScheduledAt: user.interviewScheduledAt,
    interviewCompletedAt: user.interviewCompletedAt,
    participationHistory: user.participationHistory,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
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

