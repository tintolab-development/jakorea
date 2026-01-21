/**
 * 정산 자동 산출 로직
 * Phase 0.4.1: 강사 정산 신청 (FR-G01)
 * §별첨2 강사료 산식 기준
 */

import {
  INSTRUCTOR_FEE_TABLE,
  LONG_DISTANCE_THRESHOLD_KM,
  TRANSPORT_FEE_POLICY,
  ACCOMMODATION_FEE,
  TAX_RATES,
} from '@/shared/constants/settlement-rules'

export interface SettlementCalculationParams {
  sessions: number // 차시 수 (1~6)
  distance: number // 편도 거리 (km)
  fuelCost: number // 주유비
  tollFee: number // 통행료
  accommodationRequired: boolean // 숙박비 필요 여부
  isBusinessIncome: boolean // 사업소득자 여부
}

export interface SettlementCalculationResult {
  instructorFee: number // 강사료
  transportFee: number // 교통비 (주유비 + 통행료)
  accommodationFee: number // 숙박비
  grossTotal: number // 총액 (세전)
  taxRate: number // 원천징수율
  taxAmount: number // 원천징수액
  netTotal: number // 실지급액
  breakdown: {
    sessions: number
    distance: number
    isLongDistance: boolean
    fuelCost: number
    tollFee: number
    transportFeeApplicable: boolean // 교통비 지급 대상 여부
  }
}

/**
 * 정산 자동 산출 함수
 * @param params 산출 파라미터
 * @returns 산출 결과
 */
export function calculateSettlement(
  params: SettlementCalculationParams
): SettlementCalculationResult {
  const { sessions, distance, fuelCost, tollFee, accommodationRequired, isBusinessIncome } = params

  // 1. 강사료 계산
  const isLongDistance = distance >= LONG_DISTANCE_THRESHOLD_KM
  const feeTable = INSTRUCTOR_FEE_TABLE[sessions as keyof typeof INSTRUCTOR_FEE_TABLE]
  
  if (!feeTable) {
    throw new Error(`지원하지 않는 차시 수입니다: ${sessions} (1~6차시만 지원)`)
  }
  
  const instructorFee = isLongDistance ? feeTable.longDistance : feeTable.base

  // 2. 교통비 계산 (60km 초과 시만)
  let transportTotal = 0
  const transportFeeApplicable = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
  if (transportFeeApplicable) {
    transportTotal = fuelCost + tollFee
  }

  // 3. 숙박비 계산
  const accommodationFee = accommodationRequired ? ACCOMMODATION_FEE : 0

  // 4. 총액
  const grossTotal = instructorFee + transportTotal + accommodationFee

  // 5. 원천징수 계산
  const taxRate = isBusinessIncome ? TAX_RATES.BUSINESS_INCOME : TAX_RATES.NON_BUSINESS_INCOME
  const taxAmount = Math.floor(grossTotal * taxRate)

  // 6. 실지급액
  const netTotal = grossTotal - taxAmount

  return {
    instructorFee,
    transportFee: transportTotal,
    accommodationFee,
    grossTotal,
    taxRate,
    taxAmount,
    netTotal,
    breakdown: {
      sessions,
      distance,
      isLongDistance,
      fuelCost,
      tollFee,
      transportFeeApplicable,
    },
  }
}

/**
 * 차시 수 유효성 검증
 */
export function isValidSessionCount(sessions: number): boolean {
  return sessions >= 1 && sessions <= 6
}

/**
 * 거리 기반 교통비 지급 대상 여부
 */
export function isTransportFeeApplicable(distance: number): boolean {
  return distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
}

/**
 * 장거리 여부 확인
 */
export function isLongDistance(distance: number): boolean {
  return distance >= LONG_DISTANCE_THRESHOLD_KM
}
