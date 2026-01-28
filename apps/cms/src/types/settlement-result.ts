/**
 * 정산 산출 결과 타입
 * Phase 0.2.5: 강사 산출내역 확인 (FR-E01)
 */

export interface SettlementCalculationResult {
  instructorFee: number
  transportFee: number
  accommodationFee: number
  grossTotal: number
  taxRate: number
  taxAmount: number
  netTotal: number
  breakdown: {
    sessions: number
    distance: number
    isLongDistance: boolean
    fuelCost: number
    tollFee: number
    transportFeeApplicable: boolean
  }
}
