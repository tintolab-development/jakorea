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

/**
 * 지급정보 마스킹 유틸리티
 */
export function maskBankAccount(account: string): string {
  if (!account || account.length < 4) return account
  return `${account.slice(0, 2)}****${account.slice(-4)}`
}

export function maskResidentRegistrationNumber(rrn: string): string {
  if (!rrn || rrn.length < 7) return rrn
  return `${rrn.slice(0, 6)}-*******`
}

export function maskPhone(phone: string): string {
  if (!phone) return phone
  // 010-1234-5678 -> 010-****-5678
  const parts = phone.split('-')
  if (parts.length === 3) {
    return `${parts[0]}-****-${parts[2]}`
  }
  return phone
}
