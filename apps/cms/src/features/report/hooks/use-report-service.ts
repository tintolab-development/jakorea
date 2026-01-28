/**
 * 보고서 서비스 훅
 * reportService를 래핑하여 로딩 상태 및 에러 처리 제공
 * Phase 2: 서비스 레이어 훅 래핑 (의존성 분리)
 */

import { useState, useCallback } from 'react'
import { reportService } from '@/entities/report/api/report-service'
import type { Report } from '@/types/domain'
import type { SubmitReportRequest } from '@/entities/report/api/report-service'

export interface UseReportServiceReturn {
  /** 로딩 상태 */
  loading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 보고서 제출 */
  submit: (data: SubmitReportRequest) => Promise<Report>
  /** 보고서 조회 */
  getById: (id: string) => Promise<Report>
  /** 보고서 목록 조회 */
  getAll: () => Promise<Report[]>
  /** 보고서 검토 처리 */
  review: (id: string, reviewerId: string) => Promise<Report>
  /** 보고서 승인 처리 */
  approve: (id: string, reviewerId: string, notes?: string) => Promise<Report>
  /** 보고서 반려 처리 */
  reject: (id: string, reviewerId: string, notes: string) => Promise<Report>
}

/**
 * 보고서 서비스 훅
 * 
 * @example
 * ```tsx
 * const { review, approve, reject, loading, error } = useReportService()
 * 
 * await review(reportId, userId)
 * await approve(reportId, userId, '승인합니다')
 * await reject(reportId, userId, '반려 사유')
 * ```
 */
export function useReportService(): UseReportServiceReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const submit = useCallback(async (data: SubmitReportRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await reportService.submit(data)
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
      const result = await reportService.getById(id)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await reportService.getAll()
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const review = useCallback(async (id: string, reviewerId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await reportService.review(id, reviewerId)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const approve = useCallback(async (id: string, reviewerId: string, notes?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await reportService.approve(id, reviewerId, notes)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const reject = useCallback(async (id: string, reviewerId: string, notes: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await reportService.reject(id, reviewerId, notes)
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
    submit,
    getById,
    getAll,
    review,
    approve,
    reject,
  }
}
