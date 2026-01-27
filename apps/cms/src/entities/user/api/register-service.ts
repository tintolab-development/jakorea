/**
 * 회원가입 API 서비스 (Mock)
 * Phase 0.1.2: 회원가입 흐름 (FR-B01, FR-B02)
 * Phase 0.1.3 수정: 회원가입 시 휴대폰 본인인증 및 OAuth 연동
 */

import type { RegisterRequest, RegisterResponse } from '@/types/register'
import type { User } from '@/types/user'
import { mockUsers } from '@/data/mock/users'
import { saveConsent } from '@/data/mock/consents'

// UUID 생성 함수 (users.ts와 동일)
function generateUUID(): string {
  return `user-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

/**
 * 회원가입 API
 */
export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  // Mock: 실제 API 호출 대신 지연 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 800))

  const { formData, consent, socialProvider } = request

  // 이메일 중복 체크
  const existingUser = mockUsers.find(u => u.email === formData.email)
  if (existingUser) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  // Phase 0.1.3 수정: 소셜 회원가입이 아닌 경우에만 비밀번호 확인
  if (!socialProvider) {
    // 비밀번호 확인
    if (formData.password !== formData.passwordConfirm) {
      throw new Error('비밀번호가 일치하지 않습니다.')
    }

    // 소셜 회원가입이 아닌 경우 비밀번호는 필수
    if (!formData.password || formData.password === 'social-password-placeholder') {
      throw new Error('비밀번호를 입력해주세요.')
    }
  }

  // 필수 동의 체크
  if (!consent.termsOfService || !consent.privacyPolicy) {
    throw new Error('필수 약관에 동의해주세요.')
  }

  // Phase 0.1.3 수정: 휴대폰 본인인증 확인 (소셜 연동이 아닌 경우)
  if (!socialProvider && !formData.phone) {
    throw new Error('휴대폰 본인인증을 완료해주세요.')
  }

  // Phase 0.1.3 수정: 새 사용자 생성 (소셜 회원가입 정보 포함)
  // P1: 관리자 회원가입 처리 추가
  const newUser: User = {
    id: generateUUID(),
    email: formData.email,
    password: socialProvider ? 'social-auth-placeholder' : formData.password, // 소셜 회원가입 시 임시 비밀번호
    name: formData.name,
    phone: formData.phone,
    role: formData.role,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // 역할별 추가 정보
    ...(formData.role === 'SCHOOL' && {
      schoolInfo: {
        schoolName: formData.schoolName,
        address: formData.schoolAddress,
        position: formData.position,
      },
    }),
    ...(formData.role === 'INSTRUCTOR' && {
      instructorInfo: {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
        isBusinessIncome: formData.isBusinessIncome,
      },
    }),
    // P1: 관리자 회원가입 시 adminLevel 및 초기 programRole 설정
    ...(formData.role === 'ADMIN' && {
      adminLevel: formData.adminLevel || 'GENERAL',
      // 초기 programRole은 ASSISTANT로 설정 (프로그램 생성 시 OWNER로 변경됨)
      programRoles: {},
    }),
  }

  // Mock 데이터에 추가 (실제로는 API 호출)
  mockUsers.push(newUser)

  // 동의 내역 저장
  saveConsent({
    userId: newUser.id,
    termsVersion: '1.0',
    privacyVersion: '1.0',
    termsOfService: consent.termsOfService,
    privacyPolicy: consent.privacyPolicy,
    marketingConsent: consent.marketingConsent,
    consentedAt: new Date().toISOString(),
  })

  return {
    success: true,
    userId: newUser.id,
    message: '회원가입이 완료되었습니다.',
  }
}

/**
 * 이메일 중복 체크
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const existingUser = mockUsers.find(u => u.email === email)
  return !existingUser
}
