/**
 * 동의 내역 Mock 데이터
 * Phase 0.1.2: 회원가입 흐름 (FR-B02)
 */

import type { UserConsent } from '@/types/consent'
import type { UUID } from '@/types/index'

function generateUUID(): string {
  return `consent-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

// Mock 동의 내역 데이터
export const mockConsents: UserConsent[] = [
  {
    id: generateUUID(),
    userId: 'user-001',
    termsVersion: '1.0',
    privacyVersion: '1.0',
    termsOfService: true,
    privacyPolicy: true,
    marketingConsent: true,
    consentedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: generateUUID(),
    userId: 'user-002',
    termsVersion: '1.0',
    privacyVersion: '1.0',
    termsOfService: true,
    privacyPolicy: true,
    marketingConsent: false,
    consentedAt: new Date('2024-01-02').toISOString(),
  },
]

/**
 * 사용자 ID로 동의 내역 조회
 */
export function getConsentByUserId(userId: UUID): UserConsent | null {
  return mockConsents.find(c => c.userId === userId) || null
}

/**
 * 동의 내역 저장
 */
export function saveConsent(consent: Omit<UserConsent, 'id'>): UserConsent {
  const newConsent: UserConsent = {
    ...consent,
    id: generateUUID(),
  }
  mockConsents.push(newConsent)
  return newConsent
}
