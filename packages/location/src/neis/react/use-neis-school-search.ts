import { useCallback, useState } from 'react'

import { searchNeisSchools } from '../client'
import type {
  NeisSchoolItem,
  UseNeisSchoolSearchOptions,
  UseNeisSchoolSearchReturn,
} from '../types'

export function useNeisSchoolSearch(
  options: UseNeisSchoolSearchOptions,
): UseNeisSchoolSearchReturn {
  const { apiKey, pageSize = 20, missingKeyMessage } = options
  const [schools, setSchools] = useState<NeisSchoolItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(
    async (keyword: string, page: number = 1): Promise<NeisSchoolItem[]> => {
      const trimmed = keyword.trim()
      if (!trimmed) {
        setSchools([])
        setTotalCount(0)
        setError(null)
        return []
      }

      if (!apiKey) {
        const err = new Error(missingKeyMessage ?? 'NEIS API 키가 설정되지 않았습니다.')
        setError(err)
        setSchools([])
        setTotalCount(0)
        return []
      }

      setLoading(true)
      setError(null)

      try {
        const result = await searchNeisSchools({
          apiKey,
          keyword: trimmed,
          page,
          pageSize,
          missingKeyMessage,
        })
        setSchools(result.schools)
        setTotalCount(result.totalCount)
        return result.schools
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        setSchools([])
        setTotalCount(0)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [apiKey, missingKeyMessage, pageSize],
  )

  const reset = useCallback(() => {
    setSchools([])
    setTotalCount(0)
    setError(null)
  }, [])

  return { schools, totalCount, loading, error, search, reset }
}
