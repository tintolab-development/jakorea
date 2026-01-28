/**
 * 학교 서비스 훅
 * schoolService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { schoolService } from '@/entities/school/api/school-service'
import type { School } from '@/types/domain'

export interface UseSchoolServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 모든 학교 조회 (비동기) */
  getAll: () => Promise<School[]>
  /** 학교 ID로 조회 (비동기) */
  getById: (id: string) => Promise<School>
  /** 학교 생성 */
  create: (data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => Promise<School>
  /** 학교 수정 */
  update: (id: string, data: Partial<Omit<School, 'id' | 'createdAt'>>) => Promise<School>
  /** 학교 삭제 */
  delete: (id: string) => Promise<void>
  /** 학교 이름 조회 (동기) */
  getNameById: (id: string) => string
  /** 학교 ID로 조회 (동기) */
  getByIdSync: (id: string) => School | undefined
  /** 모든 학교 조회 (동기) */
  getAllSync: () => School[]
}

/**
 * 학교 서비스 훅
 *
 * @example
 * ```tsx
 * const { getById, getAll, create, update, delete: deleteSchool, loading, error } = useSchoolService()
 *
 * const school = await getById(schoolId)
 * const schools = await getAll()
 * const newSchool = await create(schoolData)
 * ```
 */
export function useSchoolService(): UseSchoolServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await schoolService.getAll()
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
      const result = await schoolService.getById(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await schoolService.create(data)
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
    async (id: string, data: Partial<Omit<School, 'id' | 'createdAt'>>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await schoolService.update(id, data)
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

  const deleteSchool = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await schoolService.delete(id)
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
    return schoolService.getNameById(id)
  }, [])

  const getByIdSync = useCallback((id: string) => {
    return schoolService.getByIdSync(id)
  }, [])

  const getAllSync = useCallback(() => {
    return schoolService.getAllSync()
  }, [])

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    delete: deleteSchool,
    getNameById,
    getByIdSync,
    getAllSync,
  }
}
