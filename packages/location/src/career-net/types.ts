/** 커리어넷 학교정보 API 원본 content 항목 */
export interface CareerNetSchoolRow {
  schoolName?: string
  schoolGubun?: string
  schoolType?: string
  estType?: string
  region?: string
  adres?: string
  seq?: string
  link?: string
  campusName?: string
  collegeinfourl?: string
  totalCount?: string
  [key: string]: string | undefined
}

/** 검색 결과로 노출할 대학교 정보 */
export interface CareerNetUniversityItem {
  /** 학교급 내 고유 식별번호 */
  seq: string
  schoolName: string
  /** 학교종류 — 예: 대학(4년제), 전문대학 */
  schoolGubun: string
  /** 학교유형 — 예: 일반대학, 전문대학 */
  schoolType: string
  /** 설립유형 — 국립/사립/공립 */
  estType: string
  region: string
  address: string
  campusName: string
  /** 학교 홈페이지 */
  link: string
  /** mycollege 상세 URL (없으면 빈 문자열) */
  collegeInfoUrl: string
}

/** 학교유형1 — 전문대학(100322) / 대학 4년제(100323) / 전체('') */
export type CareerNetUnivSch1 = '' | '100322' | '100323'

export interface SearchCareerNetUniversitiesOptions {
  apiKey: string
  keyword: string
  /** UI 시/도명 — 커리어넷 region 코드로 변환 */
  regionSido?: string
  /** 이미 변환된 region 코드가 있으면 우선 */
  regionCode?: string
  /** 전문대학 / 4년제 필터 */
  sch1?: CareerNetUnivSch1 | string
  page?: number
  pageSize?: number
  missingKeyMessage?: string
}

export interface SearchCareerNetUniversitiesResult {
  universities: CareerNetUniversityItem[]
  totalCount: number
}

export interface UseCareerNetUniversitySearchOptions {
  apiKey: string
  /** 요청당 건수. 기본 100 */
  fetchPageSize?: number
  /** 기본 학교유형1 (전문대학 / 4년제). 비우면 전체 */
  defaultSch1?: CareerNetUnivSch1 | string
  missingKeyMessage?: string
}

export interface UseCareerNetUniversitySearchReturn {
  universities: CareerNetUniversityItem[]
  totalCount: number
  loading: boolean
  error: Error | null
  search: (
    keyword: string,
    options?: { regionSido?: string; sch1?: string },
  ) => Promise<CareerNetUniversityItem[]>
  reset: () => void
}
