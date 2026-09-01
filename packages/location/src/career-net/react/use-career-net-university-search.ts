import { useCallback, useState } from 'react'

import { searchAllCareerNetUniversities } from '../client'
import type {
  CareerNetUniversityItem,
  UseCareerNetUniversitySearchOptions,
  UseCareerNetUniversitySearchReturn,
} from '../types'

export function useCareerNetUniversitySearch(
  options: UseCareerNetUniversitySearchOptions,
): UseCareerNetUniversitySearchReturn {
  const { apiKey, fetchPageSize = 100, defaultSch1, missingKeyMessage } = options
  const [universities, setUniversities] = useState<CareerNetUniversityItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(
    async (
      keyword: string,
      searchOptions?: { regionSido?: string; sch1?: string },
    ): Promise<CareerNetUniversityItem[]> => {
      const trimmed = keyword.trim()
      if (!trimmed) {
        setUniversities([])
        setTotalCount(0)
        setError(null)
        return []
      }

      if (!apiKey) {
        const err = new Error(missingKeyMessage ?? '커리어넷 API 키가 설정되지 않았습니다.')
        setError(err)
        setUniversities([])
        setTotalCount(0)
        return []
      }

      setLoading(true)
      setError(null)

      try {
        const result = await searchAllCareerNetUniversities({
          apiKey,
          keyword: trimmed,
          regionSido: searchOptions?.regionSido,
          sch1: searchOptions?.sch1 ?? defaultSch1,
          pageSize: fetchPageSize,
          missingKeyMessage,
        })
        setUniversities(result.universities)
        setTotalCount(result.totalCount)
        return result.universities
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        setUniversities([])
        setTotalCount(0)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [apiKey, defaultSch1, fetchPageSize, missingKeyMessage],
  )

  const reset = useCallback(() => {
    setUniversities([])
    setTotalCount(0)
    setError(null)
  }, [])

  return { universities, totalCount, loading, error, search, reset }
}
