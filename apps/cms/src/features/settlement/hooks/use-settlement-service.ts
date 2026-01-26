/**
 * 정산 서비스 훅
 * settlementService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { settlementService } from '@/entities/settlement/api/settlement-service'
import type { Settlement, SettlementStatus } from '@/types/domain'

export interface UseSettlementServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 모든 정산 조회 */
  getAll: () => Promise<Settlement[]>
  /** 정산 ID로 조회 */
  getById: (id: string) => Promise<Settlement>
  /** 정산 생성 */
  create: (
    data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>
  ) => Promise<Settlement>
  /** 정산 수정 */
  update: (id: string, data: Partial<Omit<Settlement, 'id' | 'createdAt'>>) => Promise<Settlement>
  /** 정산 삭제 */
  delete: (id: string) => Promise<void>
  /** 정산 산출 완료 처리 (pending -> calculated) */
  calculate: (id: string) => Promise<Settlement>
  /** 정산 승인 처리 (review -> approved 또는 approved -> paid) */
  approve: (id: string, targetStatus?: 'approved' | 'paid') => Promise<Settlement>
  /** 정산 반려 처리 (calculated/review -> cancelled) */
  reject: (id: string, reason?: string) => Promise<Settlement>
  /** 정산 상태 변경 */
  updateStatus: (id: string, status: SettlementStatus) => Promise<Settlement>
}

/**
 * 정산 서비스 훅
 *
 * @example
 * ```tsx
 * const { getById, getAll, create, update, delete: deleteSettlement, loading, error } = useSettlementService()
 *
 * const settlement = await getById(settlementId)
 * const settlements = await getAll()
 * const newSettlement = await create(settlementData)
 * ```
 */
export function useSettlementService(): UseSettlementServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await settlementService.getAll()
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getById = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await settlementService.getById(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(
    async (data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await settlementService.create(data)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const update = useCallback(
    async (id: string, data: Partial<Omit<Settlement, 'id' | 'createdAt'>>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await settlementService.update(id, data)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const deleteSettlement = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await settlementService.delete(id)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const calculate = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await settlementService.update(id, { status: 'calculated' })
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const approve = useCallback(async (id: string, targetStatus: 'approved' | 'paid' = 'approved') => {
    setLoading(true)
    setError(null)
    try {
      const result = await settlementService.update(id, { status: targetStatus })
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const reject = useCallback(async (id: string, _reason?: string) => {
    setLoading(true)
    setError(null)
    try {
      // rejectionReason은 Settlement 타입에 없으므로 status만 업데이트
      const result = await settlementService.update(id, { 
        status: 'cancelled',
      })
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(async (id: string, status: SettlementStatus) => {
    setLoading(true)
    setError(null)
    try {
      const result = await settlementService.update(id, { status })
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    delete: deleteSettlement,
    calculate,
    approve,
    reject,
    updateStatus,
  }
}
