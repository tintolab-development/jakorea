/**
 * 정산 산출 로직 타입 정의
 * V3 Phase 4: 정산 산출 로직 설정
 */

import type { UUID, DateValue } from './index'

// 교통비 계산 규칙 타입
export type TransportationRuleType = 'distance' | 'fixed' | 'none'

// 숙박비 계산 규칙 타입
export type AccommodationRuleType = 'actual' | 'fixed' | 'none'

// 교통비 계산 규칙
export interface TransportationRule {
  type: TransportationRuleType
  distanceThreshold?: number // km (기본: 60km)
  ratePerKm?: number // km당 금액
  fixedAmount?: number // 고정 금액
  enabled: boolean
}

// 숙박비 계산 규칙
export interface AccommodationRule {
  type: AccommodationRuleType
  fixedAmount?: number // 고정 금액 (기본: 80,000원)
  maxAmount?: number // 최대 금액 (실비일 경우)
  enabled: boolean
}

// 기본 강사료 설정
export interface InstructorFeeRule {
  defaultAmount?: number // 기본 강사료
  byProgramFormat?: Record<string, number> // 프로그램 형태별 강사료
  byProgramType?: Record<string, number> // 프로그램 타입별 강사료
}

// 정산 산출 규칙
export interface SettlementCalculationRule {
  id: UUID
  name: string // 규칙 이름
  description?: string // 규칙 설명
  instructorFee: InstructorFeeRule
  transportation: TransportationRule
  accommodation: AccommodationRule
  programId?: UUID // 프로그램별 규칙 (없으면 전역 규칙)
  enabled: boolean
  createdAt: DateValue
  updatedAt: DateValue
}


