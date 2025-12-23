/**
 * Query Parameter 관리 Hook
 * Phase 1.2: URL 쿼리 파라미터 동기화
 */

import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

export function useQueryParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => {
    const result = {} as T
    searchParams.forEach((value, key) => {
      result[key as keyof T] = value as T[keyof T]
    })
    return result
  }, [searchParams])

  const setParam = useCallback(
    (key: keyof T, value: string | null | undefined) => {
      const newParams = new URLSearchParams(searchParams)
      if (value === null || value === undefined || value === '' || value === 'undefined') {
        newParams.delete(key as string)
      } else {
        newParams.set(key as string, value)
      }
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const setParams = useCallback(
    (updates: Partial<T>) => {
      const newParams = new URLSearchParams(searchParams)
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '' || value === 'undefined') {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      })
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const clearParams = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  return { params, setParam, setParams, clearParams }
}

