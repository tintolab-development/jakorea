import { useCallback, useEffect, useRef, useState } from 'react'

import { resolveNeisAtptOfcdcScCode } from '../atpt-code-map'
import { searchAllNeisSchools } from '../client'
import type {
  NeisSchoolItem,
  UseNeisSchoolSearchOptions,
  UseNeisSchoolSearchReturn,
} from '../types'

export function useNeisSchoolSearch(
  options: UseNeisSchoolSearchOptions,
): UseNeisSchoolSearchReturn {
  const { apiKey, fetchPageSize = 100, missingKeyMessage } = options
  const [schools, setSchools] = useState<NeisSchoolItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const searchGenerationRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const search = useCallback(
    async (keyword: string, sido?: string): Promise<NeisSchoolItem[]> => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      const generation = ++searchGenerationRef.current
      const trimmed = keyword.trim()
      if (!trimmed) {
        setSchools([])
        setTotalCount(0)
        setError(null)
        setLoading(false)
        return []
      }

      if (!apiKey) {
        const err = new Error(missingKeyMessage ?? 'NEIS API 키가 설정되지 않았습니다.')
        if (generation === searchGenerationRef.current) {
          setError(err)
          setSchools([])
          setTotalCount(0)
          setLoading(false)
        }
        return []
      }

      setLoading(true)
      setError(null)

      try {
        const atptOfcdcScCode = sido ? resolveNeisAtptOfcdcScCode(sido) : undefined
        const result = await searchAllNeisSchools({
          apiKey,
          keyword: trimmed,
          atptOfcdcScCode,
          pageSize: fetchPageSize,
          missingKeyMessage,
          signal: controller.signal,
        })
        if (generation !== searchGenerationRef.current) return result.schools
        setSchools(result.schools)
        setTotalCount(result.totalCount)
        return result.schools
      } catch (err) {
        if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          return []
        }
        const e = err instanceof Error ? err : new Error(String(err))
        if (generation === searchGenerationRef.current) {
          setError(e)
          setSchools([])
          setTotalCount(0)
        }
        throw e
      } finally {
        if (generation === searchGenerationRef.current) {
          setLoading(false)
        }
      }
    },
    [apiKey, fetchPageSize, missingKeyMessage],
  )

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    searchGenerationRef.current += 1
    setSchools([])
    setTotalCount(0)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return { schools, totalCount, loading, error, search, reset }
}
