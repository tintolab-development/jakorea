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
  ORG_RDNZC?: string
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
  orgRdnzc: string
  orgTelno: string
  hmpgAdres: string
  foasMemrd: string
}

export interface SearchNeisSchoolsOptions {
  apiKey: string
  keyword: string
  /** NEIS 시도교육청 코드 — 지정 시 해당 시·도 범위로 1차 검색 */
  atptOfcdcScCode?: string
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
  /** NEIS API 요청당 건수 — 전체 결과 수집 시 배치 크기. 기본 100 */
  fetchPageSize?: number
  missingKeyMessage?: string
}

export interface UseNeisSchoolSearchReturn {
  schools: NeisSchoolItem[]
  /** NEIS API 기준 검색 건수 (시·도·키워드 조건, 시/군/구 필터 전) */
  totalCount: number
  loading: boolean
  error: Error | null
  /** @param sido UI 시/도 선택값 — NEIS `ATPT_OFCDC_SC_CODE`로 변환해 API 1차 필터에 사용 */
  search: (keyword: string, sido?: string) => Promise<NeisSchoolItem[]>
  reset: () => void
}
