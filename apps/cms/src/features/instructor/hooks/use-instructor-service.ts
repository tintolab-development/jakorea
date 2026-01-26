/**
 * 강사 서비스 훅
 * instructorService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import type { Instructor } from '@/types/domain'

export interface UseInstructorServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 모든 강사 조회 (비동기) */
  getAll: () => Promise<Instructor[]>
  /** 강사 ID로 조회 (비동기) */
  getById: (id: string) => Promise<Instructor>
  /** 강사 생성 */
  create: (data: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Instructor>
  /** 강사 수정 */
  update: (id: string, data: Partial<Omit<Instructor, 'id' | 'createdAt'>>) => Promise<Instructor>
  /** 강사 삭제 */
  delete: (id: string) => Promise<void>
  /** 강사 이름 조회 (동기) */
  getNameById: (id: string) => string
  /** 강사 ID로 조회 (동기) */
  getByIdSync: (id: string) => Instructor | undefined
  /** 모든 강사 조회 (동기) */
  getAllSync: () => Instructor[]
}

/**
 * 강사 서비스 훅
 *
 * @example
 * ```tsx
 * const { getById, getAll, create, update, delete: deleteInstructor, loading, error } = useInstructorService()
 *
 * const instructor = await getById(instructorId)
 * const instructors = await getAll()
 * const newInstructor = await create(instructorData)
 * ```
 */
export function useInstructorService(): UseInstructorServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await instructorService.getAll()
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
      const result = await instructorService.getById(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await instructorService.create(data)
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
    async (id: string, data: Partial<Omit<Instructor, 'id' | 'createdAt'>>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await instructorService.update(id, data)
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

  const deleteInstructor = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await instructorService.delete(id)
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
    return instructorService.getNameById(id)
  }, [])

  const getByIdSync = useCallback((id: string) => {
    return instructorService.getByIdSync(id)
  }, [])

  const getAllSync = useCallback(() => {
    return instructorService.getAllSync()
  }, [])

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    delete: deleteInstructor,
    getNameById,
    getByIdSync,
    getAllSync,
  }
}
