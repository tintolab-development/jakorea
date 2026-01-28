/**
 * 스폰서 서비스 훅
 * sponsorService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import type { Sponsor } from '@/types/domain'

export interface UseSponsorServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 모든 스폰서 조회 (비동기) */
  getAll: () => Promise<Sponsor[]>
  /** 스폰서 ID로 조회 (비동기) */
  getById: (id: string) => Promise<Sponsor>
  /** 스폰서 생성 */
  create: (data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Sponsor>
  /** 스폰서 수정 */
  update: (id: string, data: Partial<Omit<Sponsor, 'id' | 'createdAt'>>) => Promise<Sponsor>
  /** 스폰서 삭제 */
  delete: (id: string) => Promise<void>
  /** 스폰서 이름 조회 (동기) */
  getNameById: (id: string) => string
  /** 스폰서 ID로 조회 (동기) */
  getByIdSync: (id: string) => Sponsor | undefined
  /** 모든 스폰서 조회 (동기) */
  getAllSync: () => Sponsor[]
}

/**
 * 스폰서 서비스 훅
 *
 * @example
 * ```tsx
 * const { getById, getAll, create, update, delete: deleteSponsor, loading, error } = useSponsorService()
 *
 * const sponsor = await getById(sponsorId)
 * const sponsors = await getAll()
 * const newSponsor = await create(sponsorData)
 * ```
 */
export function useSponsorService(): UseSponsorServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await sponsorService.getAll()
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
      const result = await sponsorService.getById(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await sponsorService.create(data)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(
    async (id: string, data: Partial<Omit<Sponsor, 'id' | 'createdAt'>>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await sponsorService.update(id, data)
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

  const deleteSponsor = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await sponsorService.delete(id)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // 동기 메서드들은 useCallback으로 래핑 (일관성 유지)
  const getNameById = useCallback((id: string) => {
    return sponsorService.getNameById(id)
  }, [])

  const getByIdSync = useCallback((id: string) => {
    return sponsorService.getByIdSync(id)
  }, [])

  const getAllSync = useCallback(() => {
    return sponsorService.getAllSync()
  }, [])

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    delete: deleteSponsor,
    getNameById,
    getByIdSync,
    getAllSync,
  }
}
