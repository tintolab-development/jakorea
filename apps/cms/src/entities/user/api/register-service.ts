/**
 * 회원가입 API 서비스 (Mock)
 * Phase 0.1.2: 회원가입 흐름 (FR-B01, FR-B02)
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

  const { formData, consent } = request

  // 이메일 중복 체크
  const existingUser = mockUsers.find(u => u.email === formData.email)
  if (existingUser) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  // 비밀번호 확인
  if (formData.password !== formData.passwordConfirm) {
    throw new Error('비밀번호가 일치하지 않습니다.')
  }

  // 필수 동의 체크
  if (!consent.termsOfService || !consent.privacyPolicy) {
    throw new Error('필수 약관에 동의해주세요.')
  }

  // 새 사용자 생성
  const newUser: User = {
    id: generateUUID(),
    email: formData.email,
    password: formData.password, // 실제로는 해시된 값
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
