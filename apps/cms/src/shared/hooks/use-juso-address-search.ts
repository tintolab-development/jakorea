/**
 * 행정안전부 주소 검색 API 훅 (도로명주소)
 * @see https://www.juso.go.kr/ 개발자센터
 */

import { useState, useCallback } from 'react'

/** 행안부 API는 브라우저에서 CORS 제한이 있을 수 있어, 백엔드 프록시 사용을 권장합니다. */
const JUSO_ADDR_LINK_API_URL = 'https://www.juso.go.kr/addrlink/addrLinkApi.do'

/** API 응답의 juso 항목 */
export interface JusoAddressRow {
  /** 도로명주소 */
  roadAddr: string
  /** 도로명주소 (참고항목 제외) */
  roadAddrPart1: string
  /** 지번주소 */
  jibunAddr: string
  /** 우편번호 */
  zipNo: string
  /** 행정구역코드 */
  admCd: string
  /** 시도명 */
  siNm?: string
  /** 시군구명 */
  sggNm?: string
  /** 읍면동명 */
  emdNm?: string
  /** 도로명 */
  rn?: string
  /** 건물본번 */
  buldMnnm?: string
  /** 건물부번 */
  buldSlno?: string
  [key: string]: string | undefined
}

/** 검색 결과로 노출할 주소 정보 */
export interface JusoAddressItem {
  /** 도로명주소 */
  roadAddr: string
  /** 지번주소 */
  jibunAddr: string
  /** 우편번호 */
  zipNo: string
  /** 시도명 */
  siNm: string
  /** 시군구명 */
  sggNm: string
  /** 읍면동명 */
  emdNm: string
}

function mapRowToItem(row: JusoAddressRow): JusoAddressItem {
  return {
    roadAddr: row.roadAddr ?? '',
    jibunAddr: row.jibunAddr ?? '',
    zipNo: row.zipNo ?? '',
    siNm: row.siNm ?? '',
    sggNm: row.sggNm ?? '',
    emdNm: row.emdNm ?? '',
  }
}

export interface UseJusoAddressSearchOptions {
  /** 행안부 주소 API 승인키 (juso.go.kr 신청 후 발급) */
  confmKey: string
  /** 페이지당 건수 (기본 10, 최대 100) */
  countPerPage?: number
}

export interface UseJusoAddressSearchReturn {
  /** 검색 결과 주소 목록 */
  addresses: JusoAddressItem[]
  /** 전체 검색 결과 수 */
  totalCount: number
  /** 로딩 여부 */
  loading: boolean
  /** 에러 */
  error: Error | null
  /** 키워드로 주소 검색 (빈 문자열이면 호출하지 않음) */
  search: (keyword: string, page?: number) => Promise<{ addresses: JusoAddressItem[]; totalCount: number }>
  /** 결과/에러 초기화 */
  reset: () => void
}

/**
 * 행안부 주소 검색 훅 (도로명/지번 주소 검색용)
 *
 * CORS: 브라우저에서 직접 호출 시 CORS 오류가 나면 백엔드 프록시를 두고
 * apiBaseUrl 옵션으로 프록시 URL을 넘겨 사용하세요.
 *
 * @example
 * ```tsx
 * const { addresses, totalCount, loading, error, search } = useJusoAddressSearch({
 *   confmKey: import.meta.env.VITE_JUSO_CONFM_KEY ?? '',
 * })
 *
 * const handleSearch = () => search('반포대로 58')
 * ```
 */
export function useJusoAddressSearch(
  options: UseJusoAddressSearchOptions
): UseJusoAddressSearchReturn {
  const { confmKey, countPerPage = 10 } = options
  const [addresses, setAddresses] = useState<JusoAddressItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(
    async (
      keyword: string,
      page: number = 1
    ): Promise<{ addresses: JusoAddressItem[]; totalCount: number }> => {
      const trimmed = keyword.trim()
      if (!trimmed) {
        setAddresses([])
        setTotalCount(0)
        setError(null)
        return { addresses: [], totalCount: 0 }
      }
      if (!confmKey) {
        const err = new Error('행안부 주소 API 승인키가 설정되지 않았습니다.')
        setError(err)
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
          countPerPage: String(Math.min(100, Math.max(1, countPerPage))),
          keyword: trimmed,
          resultType: 'json',
        })
        const res = await fetch(`${JUSO_ADDR_LINK_API_URL}?${params.toString()}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message ?? `HTTP ${res.status}`)
        }

        const results = data?.results
        const common = results?.common
        const errCode = common?.errorCode
        const errMsg = common?.errorMessage ?? ''

        if (errCode && errCode !== '0') {
          throw new Error(errMsg || `오류 코드: ${errCode}`)
        }

        const total = Number(common?.totalCount) || 0
        const jusoList: JusoAddressRow[] = Array.isArray(results?.juso) ? results.juso : []
        const items = jusoList.map(mapRowToItem)

        setAddresses(items)
        setTotalCount(total)
        return { addresses: items, totalCount: total }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        setAddresses([])
        setTotalCount(0)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [confmKey, countPerPage]
  )

  const reset = useCallback(() => {
    setAddresses([])
    setTotalCount(0)
    setError(null)
  }, [])

  return { addresses, totalCount, loading, error, search, reset }
}
