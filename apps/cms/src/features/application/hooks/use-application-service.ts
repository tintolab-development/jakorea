/**
 * 신청 서비스 훅
 * applicationService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { applicationService } from '@/entities/application/api/application-service'
import type { Application, ApplicationStatus } from '@/types/domain'

export interface UseApplicationServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 모든 신청 조회 */
  getAll: () => Promise<Application[]>
  /** 신청 ID로 조회 */
  getById: (id: string) => Promise<Application>
  /** 신청 생성 */
  create: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt'>) => Promise<Application>
  /** 신청 수정 */
  update: (id: string, data: Partial<Omit<Application, 'id' | 'createdAt'>>) => Promise<Application>
  /** 신청 상태 변경 */
  updateStatus: (id: string, status: ApplicationStatus, rejectionReason?: string) => Promise<Application>
  /** 신청 삭제 */
  delete: (id: string) => Promise<void>
}

/**
 * 신청 서비스 훅
 * 
 * @example
 * ```tsx
 * const { create, update, updateStatus, delete: deleteApp, loading, error } = useApplicationService()
 * 
 * const newApp = await create(applicationData)
 * await updateStatus(appId, 'approved')
 * await deleteApp(appId)
 * ```
 */
export function useApplicationService(): UseApplicationServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await applicationService.getAll()
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
      const result = await applicationService.getById(id)
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
    async (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt'>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await applicationService.create(data)
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

  const update = useCallback(async (id: string, data: Partial<Omit<Application, 'id' | 'createdAt'>>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await applicationService.update(id, data)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(
    async (id: string, status: ApplicationStatus, rejectionReason?: string) => {
      setLoading(true)
      setError(null)
      try {
        const result = await applicationService.updateStatus(id, status, rejectionReason)
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

  const deleteApp = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await applicationService.delete(id)
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
    updateStatus,
    delete: deleteApp,
  }
}
