/**
 * Query Parameter 관리 Hook
 * Phase 1.2: URL 쿼리 파라미터 동기화
 */

import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

export type SetQueryParamsOptions = {
  /**
   * false이면 히스토리에 엔트리를 추가(push). 모달·오버레이를 URL과 맞출 때 뒤로가기로 닫으려면 `replace: false` 사용.
   * @default true
   */
  replace?: boolean
}

export function useQueryParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  const [searchParams, setSearchParams] = useSearchParams()

  /** `URLSearchParams` 인스턴스는 라우터마다 렌더마다 새 참조일 수 있어, 내용 문자열로만 `params` 객체를 재생성한다. */
  const searchParamsKey = searchParams.toString()

  const params = useMemo(() => {
    const result = {} as T
    searchParams.forEach((value, key) => {
      result[key as keyof T] = value as T[keyof T]
    })
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams는 searchParamsKey와 동일 시점의 스냅샷으로만 읽음
  }, [searchParamsKey])

  const setParam = useCallback(
    (key: keyof T, value: string | null | undefined) => {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        if (value === null || value === undefined || value === '' || value === 'undefined') {
          newParams.delete(key as string)
        } else {
          newParams.set(key as string, value)
        }
        return newParams
      }, { replace: true })
    },
    [setSearchParams]
  )

  const setParams = useCallback(
    (updates: Partial<T>, options?: SetQueryParamsOptions) => {
      const replace = options?.replace ?? true
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '' || value === 'undefined') {
            newParams.delete(key)
          } else {
            newParams.set(key, value)
          }
        })
        return newParams
      }, { replace })
    },
    [setSearchParams]
  )

  const clearParams = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  return { params, setParam, setParams, clearParams }
}

