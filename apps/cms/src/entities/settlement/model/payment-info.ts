/**
 * 강사 지급 정보 타입 및 관리
 * V3 Phase 4: 지급정보 재사용 기능
 */

import type { UUID } from '@/types'

/**
 * 강사 지급 정보
 * 최초 받은 정보로 지급정보 재사용 (권한자만 확인)
 */
export interface InstructorPaymentInfo {
  instructorId: UUID
  name: string
  phone: string
  bankAccount: string
  residentRegistrationNumber?: string // 주민등록번호 (민감정보, 마스킹 필요)
  personalInfoConsent: boolean // 개인정보 동의 여부
  consentDate?: string // 동의 일자
  lastUsedAt?: string // 마지막 사용 일자
  createdAt: string
  updatedAt: string
}
