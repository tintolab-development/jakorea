/** NEIS API 원본 row 항목 (필요한 필드만) */
export interface NeisSchoolRow {
  ATPT_OFCDC_SC_CODE?: string
  ATPT_OFCDC_SC_NM?: string
  SD_SCHUL_CODE?: string
  SCHUL_NM?: string
  ENG_SCHUL_NM?: string
  SCHUL_KND_SC_NM?: string
  LCTN_SC_NM?: string
  ORG_RDNMA?: string
  ORG_FAX?: string
  ORG_TELNO?: string
  HMPG_ADRES?: string
  COEDU_SC_NM?: string
  DGHT_CRSE_SC_NM?: string
  FOAS_MEMRD?: string
  FOND_YMD?: string
  [key: string]: string | undefined
}

/** 검색 결과로 노출할 학교 정보 */
export interface NeisSchoolItem {
  sdSchulCode: string
  schulNm: string
  schulKndScNm: string
  atptOfcdcScNm: string
  lctnScNm: string
  orgRdnma: string
  orgTelno: string
  hmpgAdres: string
  foasMemrd: string
}

export interface SearchNeisSchoolsOptions {
  apiKey: string
  keyword: string
  page?: number
  pageSize?: number
  missingKeyMessage?: string
}

export interface SearchNeisSchoolsResult {
  schools: NeisSchoolItem[]
  totalCount: number
}

export interface UseNeisSchoolSearchOptions {
  apiKey: string
  pageSize?: number
  missingKeyMessage?: string
}

export interface UseNeisSchoolSearchReturn {
  schools: NeisSchoolItem[]
  totalCount: number
  loading: boolean
  error: Error | null
  search: (keyword: string, page?: number) => Promise<NeisSchoolItem[]>
  reset: () => void
}
