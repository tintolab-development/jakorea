import type { JusoAddressItem } from '@jakorea/location/juso'
import { useCallback, useEffect, useRef, useState } from 'react'

import { searchPortalAddresses } from '@/shared/api/portal-address-search-client'

export type UsePlatformAddressSearchOptions = {
  countPerPage?: number
}

export type UsePlatformAddressSearchReturn = {
  addresses: JusoAddressItem[]
  totalCount: number
  loading: boolean
  error: Error | null
  search: (
    keyword: string,
    page?: number,
    pageSize?: number,
  ) => Promise<{ addresses: JusoAddressItem[]; totalCount: number }>
  reset: () => void
}

export function usePlatformAddressSearch(
  options: UsePlatformAddressSearchOptions = {},
): UsePlatformAddressSearchReturn {
  const { countPerPage = 10 } = options
  const [addresses, setAddresses] = useState<JusoAddressItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const searchGenerationRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const search = useCallback(
    async (
      keyword: string,
      page: number = 1,
      pageSize: number = countPerPage,
    ): Promise<{ addresses: JusoAddressItem[]; totalCount: number }> => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      const gen = ++searchGenerationRef.current
      const trimmed = keyword.trim()

      if (!trimmed) {
        setAddresses([])
        setTotalCount(0)
        setError(null)
        setLoading(false)
        return { addresses: [], totalCount: 0 }
      }

      setLoading(true)
      setError(null)

      try {
        const result = await searchPortalAddresses({
          keyword: trimmed,
          page,
          size: pageSize,
          signal: controller.signal,
        })

        if (gen !== searchGenerationRef.current) {
          return result
        }

        setAddresses(result.addresses)
        setTotalCount(result.totalCount)
        return result
      } catch (err) {
        if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          return { addresses: [], totalCount: 0 }
        }
        const e = err instanceof Error ? err : new Error(String(err))
        if (gen === searchGenerationRef.current) {
          setError(e)
          setAddresses([])
          setTotalCount(0)
        }
        throw e
      } finally {
        if (gen === searchGenerationRef.current) {
          setLoading(false)
        }
      }
    },
    [countPerPage],
  )

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    searchGenerationRef.current += 1
    setAddresses([])
    setTotalCount(0)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return { addresses, totalCount, loading, error, search, reset }
}
