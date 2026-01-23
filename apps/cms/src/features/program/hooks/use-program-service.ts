/**
 * 프로그램 서비스 훅
 * programService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { programService } from '@/entities/program/api/program-service'
import type { Program, ProgramRound } from '@/types/domain'
import type { UserRole } from '@/types/user'

export interface UseProgramServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 모든 프로그램 조회 (비동기) */
  getAll: (userRole?: UserRole | null, userId?: string) => Promise<Program[]>
  /** 프로그램 ID로 조회 (비동기) */
  getById: (id: string) => Promise<Program>
  /** 프로그램 생성 */
  create: (data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Program>
  /** 프로그램 수정 */
  update: (id: string, data: Partial<Omit<Program, 'id' | 'createdAt'>>) => Promise<Program>
  /** 프로그램 삭제 */
  delete: (id: string) => Promise<void>
  /** 프로그램 라운드 수정 */
  updateRound: (
    programId: string,
    roundId: string,
    data: Partial<Omit<ProgramRound, 'id' | 'programId'>>
  ) => Promise<ProgramRound>
  /** 프로그램 이름 조회 (동기) */
  getNameById: (id: string) => string
  /** 프로그램 ID로 조회 (동기) */
  getByIdSync: (id: string) => Program | undefined
  /** 모든 프로그램 조회 (동기) */
  getAllSync: () => Program[]
}

/**
 * 프로그램 서비스 훅
 * 
 * @example
 * ```tsx
 * const { getById, getAll, create, update, delete: deleteProgram, loading, error } = useProgramService()
 * 
 * const program = await getById(programId)
 * const programs = await getAll('ADMIN')
 * const newProgram = await create(programData)
 * ```
 */
export function useProgramService(): UseProgramServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAll = useCallback(async (userRole?: UserRole | null, userId?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await programService.getAll(userRole, userId)
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
      const result = await programService.getById(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await programService.create(data)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (id: string, data: Partial<Omit<Program, 'id' | 'createdAt'>>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await programService.update(id, data)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteProgram = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await programService.delete(id)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateRound = useCallback(
    async (
      programId: string,
      roundId: string,
      data: Partial<Omit<ProgramRound, 'id' | 'programId'>>
    ) => {
      setLoading(true)
      setError(null)
      try {
        const result = await programService.updateRound(programId, roundId, data)
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

  // 동기 함수들은 그대로 전달 (로딩 상태 없음)
  const getNameById = useCallback((id: string) => {
    return programService.getNameById(id)
  }, [])

  const getByIdSync = useCallback((id: string) => {
    return programService.getByIdSync(id)
  }, [])

  const getAllSync = useCallback(() => {
    return programService.getAllSync()
  }, [])

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    delete: deleteProgram,
    updateRound,
    getNameById,
    getByIdSync,
    getAllSync,
  }
}
