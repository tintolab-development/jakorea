/**
 * 매칭 서비스 훅
 * matchingService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { matchingService } from '@/entities/matching/api/matching-service'
import type { Matching } from '@/types/domain'
import type { UUID } from '@/types'

export interface UseMatchingServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 모든 매칭 조회 */
  getAll: () => Promise<Matching[]>
  /** 매칭 ID로 조회 */
  getById: (id: UUID) => Promise<Matching>
  /** 프로그램 ID로 매칭 조회 */
  getByProgramId: (programId: UUID) => Promise<Matching[]>
  /** 매칭 생성 */
  create: (data: {
    programId: string
    roundId: string
    instructorId: string
    scheduleId?: string
    status: Matching['status']
  }) => Promise<Matching>
  /** 매칭 수정 */
  update: (
    id: UUID,
    data: Partial<Omit<Matching, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<Matching>
  /** 매칭 삭제 */
  delete: (id: UUID) => Promise<void>
  /** 매칭 확정 */
  confirm: (id: UUID) => Promise<Matching>
  /** 매칭 취소 */
  cancel: (id: UUID, reason?: string) => Promise<Matching>
  /** 매칭 ID로 조회 (동기) */
  getByIdSync: (id: UUID) => Matching | undefined
}

/**
 * 매칭 서비스 훅
 *
 * @example
 * ```tsx
 * const { getById, getAll, confirm, cancel, loading, error } = useMatchingService()
 *
 * const matching = await getById(matchingId)
 * await confirm(matchingId)
 * await cancel(matchingId, '취소 사유')
 * ```
 */
export function useMatchingService(): UseMatchingServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await matchingService.getAll()
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getById = useCallback(async (id: UUID) => {
    setLoading(true)
    setError(null)
    try {
      const result = await matchingService.getById(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getByProgramId = useCallback(async (programId: UUID) => {
    setLoading(true)
    setError(null)
    try {
      const result = await matchingService.getByProgramId(programId)
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
    async (data: {
      programId: string
      roundId: string
      instructorId: string
      scheduleId?: string
      status: Matching['status']
    }) => {
      setLoading(true)
      setError(null)
      try {
        const result = await matchingService.create(data)
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
    async (id: UUID, data: Partial<Omit<Matching, 'id' | 'createdAt' | 'updatedAt'>>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await matchingService.update(id, data)
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

  const deleteMatching = useCallback(async (id: UUID) => {
    setLoading(true)
    setError(null)
    try {
      await matchingService.delete(id)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const confirm = useCallback(async (id: UUID) => {
    setLoading(true)
    setError(null)
    try {
      const result = await matchingService.confirm(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const cancel = useCallback(async (id: UUID, reason?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await matchingService.cancel(id, reason)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // 동기 메서드
  const getByIdSync = useCallback((id: UUID) => {
    return matchingService.getByIdSync(id)
  }, [])

  return {
    loading,
    error,
    getAll,
    getById,
    getByProgramId,
    create,
    update,
    delete: deleteMatching,
    confirm,
    cancel,
    getByIdSync,
  }
}
