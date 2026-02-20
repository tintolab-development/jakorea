/**
 * 프로그램 상세 - 담당자 정보 탭 필터 쿼리 파라미터 연동
 * 필터: managerName, role (조회 시에만 적용되는 appliedFilters 패턴)
 */

import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const FILTER_KEYS = ['managerName', 'role'] as const

export interface ProgramManagersFilters {
  managerName: string
  role: string
}

const DEFAULT_FILTERS: ProgramManagersFilters = {
  managerName: '',
  role: 'all',
}

export function useProgramManagersParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo((): ProgramManagersFilters => {
    return {
      managerName: searchParams.get('managerName') ?? DEFAULT_FILTERS.managerName,
      role: searchParams.get('role') ?? DEFAULT_FILTERS.role,
    }
  }, [searchParams])

  const setFilters = useCallback(
    (updates: Partial<ProgramManagersFilters>) => {
      const next = new URLSearchParams(searchParams)
      FILTER_KEYS.forEach(name => {
        const value = updates[name]
        if (value === undefined) return
        const defaultValue = DEFAULT_FILTERS[name]
        if (value === '' || value === defaultValue) {
          next.delete(name)
        } else {
          next.set(name, value)
        }
      })
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const setFilter = useCallback(
    (key: keyof ProgramManagersFilters, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  return {
    filters,
    setFilters,
    setFilter,
  }
}
