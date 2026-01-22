/**
 * 동의 관련 타입 정의
 * Phase 0.1.2: 회원가입 흐름 (FR-B02)
 */

import type { UUID, DateValue } from './index'

/**
 * 동의 내역
 */
export interface UserConsent {
  id: UUID
  userId: UUID
  termsVersion: string // 이용약관 버전
  privacyVersion: string // 개인정보 처리방침 버전
  termsOfService: boolean // 이용약관 동의 (필수)
  privacyPolicy: boolean // 개인정보 수집 이용 동의 (필수)
  marketingConsent: boolean // 뉴스레터/홍보 동의 (선택)
  consentedAt: DateValue
}

/**
 * 약관 동의 폼 데이터
 */
export interface ConsentFormData {
  termsOfService: boolean // 이용약관 동의 (필수)
  privacyPolicy: boolean // 개인정보 수집 이용 동의 (필수)
  marketingConsent: boolean // 뉴스레터/홍보 동의 (선택)
}
