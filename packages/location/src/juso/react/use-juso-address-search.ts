import { useCallback, useRef, useState } from 'react'

import { searchJusoAddresses } from '../client'
import { JUSO_ADDR_LINK_API_URL } from '../constants'
import type { JusoAddressItem, UseJusoAddressSearchOptions, UseJusoAddressSearchReturn } from '../types'

export function useJusoAddressSearch(
  options: UseJusoAddressSearchOptions,
): UseJusoAddressSearchReturn {
  const {
    confmKey,
    countPerPage = 10,
    apiUrl = JUSO_ADDR_LINK_API_URL,
    missingKeyMessage,
  } = options
  const [addresses, setAddresses] = useState<JusoAddressItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const searchGenerationRef = useRef(0)

  const search = useCallback(
    async (
      keyword: string,
      page: number = 1,
      pageSize: number = countPerPage,
    ): Promise<{ addresses: JusoAddressItem[]; totalCount: number }> => {
      const gen = ++searchGenerationRef.current
      const trimmed = keyword.trim()

      if (!trimmed) {
        setAddresses([])
        setTotalCount(0)
        setError(null)
        setLoading(false)
        return { addresses: [], totalCount: 0 }
      }

      if (!confmKey) {
        const err = new Error(
          missingKeyMessage ??
            '행안부 주소 API 승인키가 설정되지 않았습니다. VITE_ADDRESS_API_KEY 또는 VITE_JUSO_CONFM_KEY를 설정한 뒤 개발 서버를 재시작해 주세요.',
        )
        if (gen === searchGenerationRef.current) {
          setError(err)
          setAddresses([])
          setTotalCount(0)
        }
        return { addresses: [], totalCount: 0 }
      }

      setLoading(true)
      setError(null)

      try {
        const result = await searchJusoAddresses({
          confmKey,
          keyword: trimmed,
          page,
          countPerPage: pageSize,
          apiUrl,
          missingKeyMessage,
        })

        if (gen !== searchGenerationRef.current) {
          return result
        }

        setAddresses(result.addresses)
        setTotalCount(result.totalCount)
        return result
      } catch (err) {
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
    [apiUrl, confmKey, countPerPage, missingKeyMessage],
  )

  const reset = useCallback(() => {
    searchGenerationRef.current += 1
    setAddresses([])
    setTotalCount(0)
    setError(null)
    setLoading(false)
  }, [])

  return { addresses, totalCount, loading, error, search, reset }
}
