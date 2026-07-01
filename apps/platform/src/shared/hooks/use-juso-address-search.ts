import { useCallback, useRef, useState } from 'react'

const JUSO_ADDR_LINK_API_URL = 'https://www.juso.go.kr/addrlink/addrLinkApi.do'

export function readJusoConfmKeyFromEnv() {
  const addressApiKey = import.meta.env.VITE_ADDRESS_API_KEY
  const jusoConfmKey = import.meta.env.VITE_JUSO_CONFM_KEY

  return String(addressApiKey ?? jusoConfmKey ?? '').trim()
}

export type JusoAddressRow = {
  roadAddr: string
  jibunAddr: string
  engAddr?: string
  zipNo: string
  siNm?: string
  sggNm?: string
  emdNm?: string
  rn?: string
  [key: string]: string | undefined
}

export type JusoAddressItem = {
  roadAddr: string
  jibunAddr: string
  engAddr?: string
  zipNo: string
  siNm: string
  sggNm: string
  emdNm: string
  rn?: string
}

type UseJusoAddressSearchOptions = {
  confmKey: string
  countPerPage?: number
  apiUrl?: string
}

function mapRowToItem(row: JusoAddressRow): JusoAddressItem {
  const engAddr = row.engAddr?.trim()

  return {
    roadAddr: row.roadAddr ?? '',
    jibunAddr: row.jibunAddr ?? '',
    engAddr: engAddr || undefined,
    zipNo: row.zipNo ?? '',
    siNm: row.siNm ?? '',
    sggNm: row.sggNm ?? '',
    emdNm: row.emdNm ?? '',
    rn: row.rn,
  }
}

export function useJusoAddressSearch({
  confmKey,
  countPerPage = 10,
  apiUrl = import.meta.env.VITE_JUSO_ADDRESS_API_URL || JUSO_ADDR_LINK_API_URL,
}: UseJusoAddressSearchOptions) {
  const [addresses, setAddresses] = useState<JusoAddressItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const searchGenerationRef = useRef(0)

  const search = useCallback(
    async (keyword: string, page = 1, pageSize = countPerPage) => {
      const generation = ++searchGenerationRef.current
      const trimmedKeyword = keyword.trim()

      if (!trimmedKeyword) {
        setAddresses([])
        setTotalCount(0)
        setError(null)
        setLoading(false)
        return { addresses: [], totalCount: 0 }
      }

      if (!confmKey) {
        const nextError = new Error(
          '주소 API 승인키가 설정되지 않았습니다. apps/platform/.env에 VITE_ADDRESS_API_KEY 또는 VITE_JUSO_CONFM_KEY를 설정한 뒤 Platform dev server를 재시작해 주세요.'
        )
        setError(nextError)
        setAddresses([])
        setTotalCount(0)
        return { addresses: [], totalCount: 0 }
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          confmKey,
          currentPage: String(page),
          countPerPage: String(Math.min(100, Math.max(1, pageSize))),
          keyword: trimmedKeyword,
          resultType: 'json',
        })
        const response = await fetch(`${apiUrl}?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message ?? `HTTP ${response.status}`)
        }

        const common = data?.results?.common
        const errorCode = common?.errorCode

        if (errorCode && errorCode !== '0') {
          throw new Error(common?.errorMessage || `오류 코드: ${errorCode}`)
        }

        const total = Number(common?.totalCount) || 0
        const jusoList: JusoAddressRow[] = Array.isArray(data?.results?.juso)
          ? data.results.juso
          : []
        const items = jusoList.map(mapRowToItem)

        if (generation === searchGenerationRef.current) {
          setAddresses(items)
          setTotalCount(total)
        }

        return { addresses: items, totalCount: total }
      } catch (error) {
        const nextError = error instanceof Error ? error : new Error(String(error))

        if (generation === searchGenerationRef.current) {
          setError(nextError)
          setAddresses([])
          setTotalCount(0)
        }

        return { addresses: [], totalCount: 0 }
      } finally {
        if (generation === searchGenerationRef.current) {
          setLoading(false)
        }
      }
    },
    [apiUrl, confmKey, countPerPage],
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
