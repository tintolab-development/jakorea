/**
 * NEIS(나이스) 교육정보 개방 포털 학교 검색 훅
 * @see https://open.neis.go.kr/
 */

import { useState, useCallback } from 'react'

const NEIS_SCHOOL_INFO_URL = 'https://open.neis.go.kr/hub/schoolInfo'

/** NEIS API 원본 row 항목 (필요한 필드만) */
export interface NeisSchoolRow {
  /** 시도교육청코드 */
  ATPT_OFCDC_SC_CODE?: string
  /** 시도교육청명 */
  ATPT_OFCDC_SC_NM?: string
  /** 표준학교코드 */
  SD_SCHUL_CODE?: string
  /** 학교명 */
  SCHUL_NM?: string
  /** 영문학교명 */
  ENG_SCHUL_NM?: string
  /** 학교종류명 (유치원, 초등학교, 중학교, 고등학교 등) */
  SCHUL_KND_SC_NM?: string
  /** 소재지명 */
  LCTN_SC_NM?: string
  /** 주소 */
  ORG_RDNMA?: string
  /** 우편번호 */
  ORG_FAX?: string
  /** 전화번호 */
  ORG_TELNO?: string
  /** 홈페이지주소 */
  HMPG_ADRES?: string
  /** 남녀공학구분명 */
  COEDU_SC_NM?: string
  /** 주야구분명 */
  DGHT_CRSE_SC_NM?: string
  /** 개교기념일 */
  FOAS_MEMRD?: string
  /** 설립일자 */
  FOND_YMD?: string
  [key: string]: string | undefined
}

/** 검색 결과로 노출할 학교 정보 */
export interface NeisSchoolItem {
  /** 표준학교코드 */
  sdSchulCode: string
  /** 학교명 */
  schulNm: string
  /** 학교종류명 */
  schulKndScNm: string
  /** 시도교육청명 */
  atptOfcdcScNm: string
  /** 소재지명 (시도) */
  lctnScNm: string
  /** 주소 */
  orgRdnma: string
  /** 전화번호 */
  orgTelno: string
  /** 홈페이지 */
  hmpgAdres: string
  /** 개교기념일 */
  foasMemrd: string
}

function mapRowToItem(row: NeisSchoolRow): NeisSchoolItem {
  return {
    sdSchulCode: row.SD_SCHUL_CODE ?? '',
    schulNm: row.SCHUL_NM ?? '',
    schulKndScNm: row.SCHUL_KND_SC_NM ?? '',
    atptOfcdcScNm: row.ATPT_OFCDC_SC_NM ?? '',
    lctnScNm: row.LCTN_SC_NM ?? '',
    orgRdnma: row.ORG_RDNMA ?? '',
    orgTelno: row.ORG_TELNO ?? '',
    hmpgAdres: row.HMPG_ADRES ?? '',
    foasMemrd: row.FOAS_MEMRD ?? '',
  }
}

export interface UseNeisSchoolSearchOptions {
  /** NEIS 인증키 (open.neis.go.kr에서 발급) */
  apiKey: string
  /** 페이지당 건수 (기본 20) */
  pageSize?: number
}

export interface UseNeisSchoolSearchReturn {
  /** 검색 결과 학교 목록 */
  schools: NeisSchoolItem[]
  /** 로딩 여부 */
  loading: boolean
  /** 에러 (API 실패 또는 인증 실패 시) */
  error: Error | null
  /** 학교명으로 검색 (빈 문자열이면 호출하지 않음) */
  search: (keyword: string, page?: number) => Promise<NeisSchoolItem[]>
  /** 결과/에러 초기화 */
  reset: () => void
}

/**
 * NEIS 학교 검색 훅 (최종학력 등 학교명 검색용)
 *
 * @example
 * ```tsx
 * const { schools, loading, error, search } = useNeisSchoolSearch({
 *   apiKey: import.meta.env.VITE_NEIS_API_KEY ?? '',
 * })
 *
 * const handleSearch = () => search('광남고')
 * ```
 */
export function useNeisSchoolSearch(
  options: UseNeisSchoolSearchOptions
): UseNeisSchoolSearchReturn {
  const { apiKey, pageSize = 20 } = options
  const [schools, setSchools] = useState<NeisSchoolItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(
    async (keyword: string, page: number = 1): Promise<NeisSchoolItem[]> => {
      const trimmed = keyword.trim()
      if (!trimmed) {
        setSchools([])
        setError(null)
        return []
      }
      if (!apiKey) {
        const err = new Error('NEIS API 키가 설정되지 않았습니다.')
        setError(err)
        setSchools([])
        return []
      }

      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          KEY: apiKey,
          Type: 'json',
          pIndex: String(page),
          pSize: String(pageSize),
          SCHUL_NM: trimmed,
        })
        const res = await fetch(`${NEIS_SCHOOL_INFO_URL}?${params.toString()}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message ?? `HTTP ${res.status}`)
        }

        // 성공 시: schoolInfo[0].row 배열
        const schoolInfo = data?.schoolInfo
        if (Array.isArray(schoolInfo) && schoolInfo.length > 0) {
          const first = schoolInfo[0]
          if (first.RESULT) {
            const code = first.RESULT.CODE ?? ''
            const msg = first.RESULT.MESSAGE ?? '검색 결과가 없습니다.'
            if (code === 'INFO-200' || code.includes('INFO')) {
              setSchools([])
              return []
            }
            throw new Error(msg)
          }
          const rows: NeisSchoolRow[] = Array.isArray(first.row) ? first.row : []
          const items = rows.map(mapRowToItem)
          setSchools(items)
          return items
        }

        // 최상위 RESULT (에러)
        if (data?.RESULT) {
          const msg = data.RESULT.MESSAGE ?? data.RESULT.CODE ?? 'API 오류'
          throw new Error(msg)
        }

        setSchools([])
        return []
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        setSchools([])
        throw e
      } finally {
        setLoading(false)
      }
    },
    [apiKey, pageSize]
  )

  const reset = useCallback(() => {
    setSchools([])
    setError(null)
  }, [])

  return { schools, loading, error, search, reset }
}
