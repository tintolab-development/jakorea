/**
 * URL 쿼리 파라미터 유틸리티 훅
 * 필터링, 정렬, 페이지네이션 상태를 URL과 동기화
 */

import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  region?: string
  specialty?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  // 프로그램 필터 파라미터
  sponsorId?: string
  type?: string
  format?: string
  status?: string
  // 신청 필터 파라미터
  programId?: string
  subjectType?: string
  // 매칭 필터 파라미터
  instructorId?: string
  // 일정 필터 파라미터 (programId, instructorId 재사용)
}

/**
 * URL 쿼리 파라미터를 읽고 업데이트하는 훅
 */
export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 쿼리 파라미터 읽기
  const params = useMemo<QueryParams>(() => {
    const page = searchParams.get('page')
    const pageSize = searchParams.get('pageSize')
    const search = searchParams.get('search')
    const region = searchParams.get('region')
    const specialty = searchParams.get('specialty')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null
    const sponsorId = searchParams.get('sponsorId')
    const type = searchParams.get('type')
    const format = searchParams.get('format')
    const status = searchParams.get('status')
    const programId = searchParams.get('programId')
    const subjectType = searchParams.get('subjectType')
    const instructorId = searchParams.get('instructorId')

    return {
      ...(page && { page: parseInt(page, 10) }),
      ...(pageSize && { pageSize: parseInt(pageSize, 10) }),
      ...(search && { search }),
      ...(region && { region }),
      ...(specialty && { specialty }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && (sortOrder === 'asc' || sortOrder === 'desc') && { sortOrder }),
      ...(sponsorId && { sponsorId }),
      ...(type && { type }),
      ...(format && { format }),
      ...(status && { status }),
      ...(programId && { programId }),
      ...(subjectType && { subjectType }),
      ...(instructorId && { instructorId }),
    }
  }, [searchParams])

  // 쿼리 파라미터 업데이트 (기존 파라미터 유지하며 병합)
  const updateParams = useCallback(
    (updates: Partial<QueryParams>, replace = false) => {
      setSearchParams(
        prev => {
          const newParams = new URLSearchParams(replace ? undefined : prev)

          Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
              newParams.delete(key)
            } else {
              newParams.set(key, String(value))
            }
          })

          // 페이지는 항상 1로 리셋 (필터/정렬 변경 시)
          if (
            updates.search !== undefined ||
            updates.region !== undefined ||
            updates.specialty !== undefined ||
            updates.sponsorId !== undefined ||
            updates.type !== undefined ||
            updates.format !== undefined ||
            updates.status !== undefined ||
            updates.programId !== undefined ||
            updates.subjectType !== undefined ||
            updates.sortBy !== undefined ||
            updates.sortOrder !== undefined
          ) {
            if (!updates.page) {
              newParams.set('page', '1')
            }
          }

          return newParams
        },
        { replace }
      )
    },
    [setSearchParams]
  )

  // 특정 파라미터 삭제
  const deleteParam = useCallback(
    (key: keyof QueryParams) => {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        newParams.delete(key)
        return newParams
      })
    },
    [setSearchParams]
  )

  // 모든 파라미터 초기화
  const clearParams = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  return {
    params,
    updateParams,
    deleteParam,
    clearParams,
  }
}
