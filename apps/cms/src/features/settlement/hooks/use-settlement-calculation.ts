/**
 * 정산 자동 산출 훅
 * Phase 0.4.1: 강사 정산 신청 (FR-G01)
 */

import { useState, useCallback, useMemo } from 'react'
import {
  calculateSettlement,
  type SettlementCalculationParams,
  type SettlementCalculationResult,
  isValidSessionCount,
  isTransportFeeApplicable,
} from '@/entities/settlement/lib/settlement-calculation'

interface UseSettlementCalculationResult {
  result: SettlementCalculationResult | null
  loading: boolean
  calculate: (params: SettlementCalculationParams) => void
  reset: () => void
  isValid: boolean
}

export function useSettlementCalculation(): UseSettlementCalculationResult {
  const [result, setResult] = useState<SettlementCalculationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const calculate = useCallback((params: SettlementCalculationParams) => {
    setLoading(true)
    try {
      // 유효성 검증
      if (!isValidSessionCount(params.sessions)) {
        throw new Error('차시 수는 1~6차시만 지원됩니다')
      }

      if (params.distance < 0) {
        throw new Error('거리는 0 이상이어야 합니다')
      }

      if (params.fuelCost < 0 || params.tollFee < 0) {
        throw new Error('주유비와 통행료는 0 이상이어야 합니다')
      }

      // 교통비 지급 대상 확인
      if (!isTransportFeeApplicable(params.distance) && (params.fuelCost > 0 || params.tollFee > 0)) {
        // 60km 이하인데 교통비가 입력된 경우 경고는 하지만 계산은 진행
        console.warn('60km 이하인 경우 교통비가 지급되지 않습니다')
      }

      const calculationResult = calculateSettlement(params)
      setResult(calculationResult)
    } catch (error) {
      console.error('정산 산출 오류:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  const isValid = useMemo(() => {
    if (!result) return false
    return result.grossTotal > 0 && result.netTotal > 0
  }, [result])

  return {
    result,
    loading,
    calculate,
    reset,
    isValid,
  }
}
