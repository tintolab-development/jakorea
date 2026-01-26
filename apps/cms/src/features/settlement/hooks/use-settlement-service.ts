/**
 * 정산 서비스 훅
 * settlementService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { settlementService } from '@/entities/settlement/api/settlement-service'
import type { Settlement } from '@/types/domain'

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

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    delete: deleteSettlement,
  }
}
