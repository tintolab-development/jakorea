/**
 * List 페이지 필터링 로직 공통 훅
 * 검색어, Select 필터 등을 통합 관리
 */

import { useState, useMemo, useCallback } from 'react'

export interface FilterConfig<T> {
  /** 검색 대상 필드 (문자열 검색) */
  search?: {
    keys: (keyof T)[]
  }
  /** Select 필터 설정 */
  selects?: Record<string, {
    key: keyof T
    options: Array<{ label: string; value: any }>
  }>
}

export interface UseListFiltersOptions<T> {
  /** 필터링할 데이터 */
  data: T[]
  /** 필터 설정 */
  filterConfig?: FilterConfig<T>
  /** 기본 필터 값 */
  defaultFilters?: Record<string, any>
}

export interface UseListFiltersReturn<T> {
  /** 검색어 */
  searchText: string
  /** 검색어 설정 */
  setSearchText: (value: string) => void
  /** 필터 값 객체 */
  filters: Record<string, any>
  /** 필터 값 설정 */
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>
  /** 필터 값 변경 핸들러 */
  handleFilterChange: (key: string, value: any) => void
  /** 필터링된 데이터 */
  filtered: T[]
  /** 필터 초기화 */
  resetFilters: () => void
}

/**
 * List 페이지 필터링 로직 공통 훅
 * 
 * @example
 * ```tsx
 * const {
 *   searchText,
 *   setSearchText,
 *   filters,
 *   handleFilterChange,
 *   filtered,
 *   resetFilters,
 * } = useListFilters({
 *   data: items,
 *   filterConfig: {
 *     search: { keys: ['title', 'content', 'author'] },
 *     selects: {
 *       status: {
 *         key: 'status',
 *         options: [
 *           { label: '전체', value: 'all' },
 *           { label: '활성', value: 'active' },
 *         ],
 *       },
 *     },
 *   },
 *   defaultFilters: { status: 'all' },
 * })
 * ```
 */
export function useListFilters<T extends Record<string, any>>({
  data,
  filterConfig,
  defaultFilters = {},
}: UseListFiltersOptions<T>): UseListFiltersReturn<T> {
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>(defaultFilters)

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setSearchText('')
    setFilters(defaultFilters)
  }, [defaultFilters])

  const filtered = useMemo(() => {
    return data.filter((item) => {
      // 검색어 필터
      if (searchText && filterConfig?.search) {
        const searchKeys = filterConfig.search.keys
        const matchesSearch = searchKeys.some((key) => {
          const value = item[key]
          if (value == null) return false
          return String(value).toLowerCase().includes(searchText.toLowerCase())
        })
        if (!matchesSearch) return false
      }

      // Select 필터
      if (filterConfig?.selects) {
        for (const [filterKey, selectConfig] of Object.entries(filterConfig.selects)) {
          const filterValue = filters[filterKey]
          if (filterValue != null && filterValue !== 'all' && filterValue !== '') {
            const itemValue = item[selectConfig.key]
            if (itemValue !== filterValue) return false
          }
        }
      }

      return true
    })
  }, [data, searchText, filters, filterConfig])

  return {
    searchText,
    setSearchText,
    filters,
    setFilters,
    handleFilterChange,
    filtered,
    resetFilters,
  }
}
