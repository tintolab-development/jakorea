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
import type { SettlementCalculationResult } from '@/types/settlement-result'
import type { SettlementCalculationRule } from '@/types/settlement-calculation'
import type { UUID } from '@/types'
import { settlementCalculationRuleService } from '../api/settlement-calculation-rule-service'

export interface SettlementCalculationParams {
  sessions: number // 차시 수 (1~6)
  distance: number // 편도 거리 (km)
  fuelCost: number // 주유비
  tollFee: number // 통행료
  accommodationRequired: boolean // 숙박비 필요 여부
  isBusinessIncome: boolean // 사업소득자 여부
  // V3 Phase 4: 일사일교 사업 특수성
  isSpecialProgram?: boolean // 일사일교 사업 여부
  accommodationActualCost?: number // 숙박비 실비 (타지역 이동 시)
  // Phase 0.4.1: 프로젝트별 커스터마이징
  rule?: SettlementCalculationRule // 프로그램별 규칙 (없으면 기본 규칙 사용)
}

export type { SettlementCalculationResult }

/**
 * 정산 자동 산출 함수
 * @param params 산출 파라미터
 * @returns 산출 결과
 */
export function calculateSettlement(
  params: SettlementCalculationParams
): SettlementCalculationResult {
  const {
    sessions,
    distance,
    fuelCost,
    tollFee,
    accommodationRequired,
    isBusinessIncome,
    isSpecialProgram = false,
    accommodationActualCost,
    rule,
  } = params

  // Phase 0.4.1: 프로그램별 규칙 적용 (없으면 기본 규칙 사용)
  const transportRule = rule?.transportation || {
    type: 'distance' as const,
    distanceThreshold: TRANSPORT_FEE_POLICY.minimumDistanceForTransport,
    enabled: true,
  }
  const accommodationRule = rule?.accommodation || {
    type: 'fixed' as const,
    fixedAmount: ACCOMMODATION_FEE,
    enabled: true,
  }

  // 1. 강사료 계산
  const isLongDistance = distance >= LONG_DISTANCE_THRESHOLD_KM
  const feeTable = INSTRUCTOR_FEE_TABLE[sessions as keyof typeof INSTRUCTOR_FEE_TABLE]
  
  if (!feeTable) {
    throw new Error(`지원하지 않는 차시 수입니다: ${sessions} (1~6차시만 지원)`)
  }
  
  const instructorFee = isLongDistance ? feeTable.longDistance : feeTable.base

  // 2. 교통비 계산 (프로그램별 규칙 적용)
  let transportTotal = 0
  const threshold = transportRule.distanceThreshold ?? TRANSPORT_FEE_POLICY.minimumDistanceForTransport
  const transportFeeApplicable = transportRule.enabled && distance > threshold
  
  if (transportFeeApplicable) {
    switch (transportRule.type) {
      case 'distance':
        // 기본: 주유비 + 통행료
        transportTotal = fuelCost + tollFee
        break
      case 'fixed':
        // 고정 금액
        transportTotal = transportRule.fixedAmount || 0
        break
      case 'none':
        // 교통비 미지급
        transportTotal = 0
        break
    }
  }

  // 3. 숙박비 계산 (프로그램별 규칙 적용)
  let accommodationFee = 0
  if (accommodationRequired && accommodationRule.enabled) {
    switch (accommodationRule.type) {
      case 'fixed':
        // 고정 금액 (기본 또는 규칙에서 지정)
        accommodationFee = accommodationRule.fixedAmount || ACCOMMODATION_FEE
        break
      case 'actual':
        // 실비 (일사일교 사업 특수성 또는 규칙에서 지정)
        if (isSpecialProgram && accommodationActualCost && accommodationActualCost > 0) {
          accommodationFee = accommodationActualCost
          // 최대 금액 제한이 있으면 적용
          if (accommodationRule.maxAmount && accommodationFee > accommodationRule.maxAmount) {
            accommodationFee = accommodationRule.maxAmount
          }
        } else {
          // 실비가 없으면 고정 금액 사용
          accommodationFee = accommodationRule.fixedAmount || ACCOMMODATION_FEE
        }
        break
      case 'none':
        // 숙박비 미지급
        accommodationFee = 0
        break
    }
  }

  // 4. 총액
  const grossTotal = instructorFee + transportTotal + accommodationFee

  // 5. 원천징수 계산
  const taxRate = isBusinessIncome ? TAX_RATES.BUSINESS_INCOME : TAX_RATES.NON_BUSINESS_INCOME
  const taxAmount = Math.floor(grossTotal * taxRate)

  // 6. 실지급액
  const netTotal = grossTotal - taxAmount

  const result: SettlementCalculationResult = {
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
  return result
}

  /**
   * Phase 0.4.1: 프로그램별 규칙을 적용한 정산 계산 (비동기)
   * FR-G01: 일사일교 사업 특수성 - rule.isSpecialProgram 반영
   * @param programId 프로그램 ID
   * @param params 산출 파라미터
   * @returns 산출 결과
   */
export async function calculateSettlementWithProgramRule(
  programId: UUID,
  params: Omit<SettlementCalculationParams, 'rule'>
): Promise<SettlementCalculationResult> {
  const rule = await settlementCalculationRuleService.getRuleByProgram(programId)
  const isSpecialProgram = params.isSpecialProgram ?? rule?.isSpecialProgram ?? false
  return calculateSettlement({
    ...params,
    isSpecialProgram,
    rule,
  })
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

/**
 * Phase 0.4.1: 산출 결과 검증
 * 산출 결과가 올바른지 검증하는 헬퍼 함수
 */
export function validateSettlementResult(
  result: SettlementCalculationResult,
  params: SettlementCalculationParams
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 1. 강사료 검증
  const isLongDistance = params.distance >= LONG_DISTANCE_THRESHOLD_KM
  const feeTable = INSTRUCTOR_FEE_TABLE[params.sessions as keyof typeof INSTRUCTOR_FEE_TABLE]
  if (feeTable) {
    const expectedInstructorFee = isLongDistance ? feeTable.longDistance : feeTable.base
    if (result.instructorFee !== expectedInstructorFee) {
      errors.push(`강사료 불일치: 예상 ${expectedInstructorFee}, 실제 ${result.instructorFee}`)
    }
  }

  // 2. 교통비 검증
  const transportFeeApplicable = params.distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
  const expectedTransportFee = transportFeeApplicable ? params.fuelCost + params.tollFee : 0
  if (result.transportFee !== expectedTransportFee) {
    errors.push(`교통비 불일치: 예상 ${expectedTransportFee}, 실제 ${result.transportFee}`)
  }

  // 3. 숙박비 검증
  let expectedAccommodationFee = 0
  if (params.accommodationRequired) {
    if (params.isSpecialProgram && params.accommodationActualCost && params.accommodationActualCost > 0) {
      expectedAccommodationFee = params.accommodationActualCost
    } else {
      expectedAccommodationFee = ACCOMMODATION_FEE
    }
  }
  if (result.accommodationFee !== expectedAccommodationFee) {
    errors.push(`숙박비 불일치: 예상 ${expectedAccommodationFee}, 실제 ${result.accommodationFee}`)
  }

  // 4. 총액 검증
  const expectedGrossTotal = result.instructorFee + result.transportFee + result.accommodationFee
  if (result.grossTotal !== expectedGrossTotal) {
    errors.push(`총액 불일치: 예상 ${expectedGrossTotal}, 실제 ${result.grossTotal}`)
  }

  // 5. 원천징수 검증
  const expectedTaxRate = params.isBusinessIncome ? TAX_RATES.BUSINESS_INCOME : TAX_RATES.NON_BUSINESS_INCOME
  if (Math.abs(result.taxRate - expectedTaxRate) > 0.0001) {
    errors.push(`원천징수율 불일치: 예상 ${expectedTaxRate}, 실제 ${result.taxRate}`)
  }
  const expectedTaxAmount = Math.floor(result.grossTotal * expectedTaxRate)
  if (result.taxAmount !== expectedTaxAmount) {
    errors.push(`원천징수액 불일치: 예상 ${expectedTaxAmount}, 실제 ${result.taxAmount}`)
  }

  // 6. 실지급액 검증
  const expectedNetTotal = result.grossTotal - result.taxAmount
  if (result.netTotal !== expectedNetTotal) {
    errors.push(`실지급액 불일치: 예상 ${expectedNetTotal}, 실제 ${result.netTotal}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
